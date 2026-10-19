use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{Read, Write},
    path::{Component, Path, PathBuf},
    sync::Mutex,
};
use tauri::{Emitter, Manager, State};
use tauri_plugin_dialog::DialogExt;
mod connections;
mod image_export;

const MAX_BYTES: u64 = 8 * 1024 * 1024;
#[derive(Default)]
struct Workspace(Mutex<Option<PathBuf>>);
#[derive(Default)]
struct SessionStore(Mutex<Option<PathBuf>>);
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
struct SessionRecord {
    workspace: String,
    tabs: Vec<String>,
    active: Option<usize>,
}
#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
struct LoadedSession {
    record: SessionRecord,
    skipped: usize,
}
#[derive(Serialize)]
struct Entry {
    name: String,
    path: String,
    directory: bool,
}
#[derive(Serialize)]
struct Document {
    path: String,
    content: String,
    revision: String,
}
#[derive(Clone, Serialize)]
#[serde(tag = "kind", content = "path")]
enum CreateResult {
    Created(String),
    ExistingMarkdown(String),
}
#[derive(Clone, Serialize)]
struct CreateEvent {
    result: Option<CreateResult>,
    error: Option<String>,
}
fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}
fn revision(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}
fn markdown(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .is_some_and(|e| matches!(e.to_ascii_lowercase().as_str(), "md" | "markdown"))
}
// Never accept absolute paths, traversal, or symlinks, including intermediate directories.
fn resolve(root: &Path, relative: &str) -> Result<PathBuf, String> {
    let path = Path::new(relative);
    let mut current = root.to_path_buf();
    for part in path.components() {
        match part {
            Component::Normal(name) => {
                current.push(name);
                if fs::symlink_metadata(&current)
                    .map_err(err)?
                    .file_type()
                    .is_symlink()
                {
                    return Err("Symbolic links are not supported for workspace files.".into());
                }
            }
            _ => return Err("Invalid workspace-relative path.".into()),
        }
    }
    let canonical = current.canonicalize().map_err(err)?;
    if !canonical.starts_with(root) {
        return Err("Path is outside the workspace.".into());
    }
    Ok(canonical)
}
fn read_bytes(path: &Path) -> Result<Vec<u8>, String> {
    if !markdown(path) {
        return Err("Only .md and .markdown files can be opened.".into());
    }
    let file = fs::File::open(path).map_err(err)?;
    if !file.metadata().map_err(err)?.is_file() {
        return Err("Not a regular file.".into());
    }
    let mut bytes = Vec::new();
    file.take(MAX_BYTES + 1)
        .read_to_end(&mut bytes)
        .map_err(err)?;
    if bytes.len() as u64 > MAX_BYTES {
        return Err("This MVP supports Markdown files up to 8 MiB.".into());
    }
    Ok(bytes)
}
fn read_document(root: &Path, relative: &str) -> Result<Document, String> {
    let bytes = read_bytes(&resolve(root, relative)?)?;
    let content = String::from_utf8(bytes.clone())
        .map_err(|_| "File is not valid UTF-8; it was not modified.".to_string())?;
    if content.contains('\0') {
        return Err("Binary files cannot be edited.".into());
    }
    Ok(Document {
        path: relative.into(),
        content,
        revision: revision(&bytes),
    })
}
fn valid_session_workspace(record: &SessionRecord) -> Result<(), String> {
    if !Path::new(&record.workspace).is_absolute() || record.workspace.contains('\0') {
        return Err("Invalid workspace path in session.".into());
    }
    Ok(())
}
fn safe_session_tab(path: &str) -> bool {
    !path.is_empty()
        && path.len() <= 4096
        && markdown(Path::new(path))
        && Path::new(path)
            .components()
            .all(|part| matches!(part, Component::Normal(_)))
}
fn valid_session_paths(record: &SessionRecord) -> Result<(), String> {
    valid_session_workspace(record)?;
    if record.tabs.len() > 500 {
        return Err("Session contains too many document paths.".into());
    }
    let mut unique = std::collections::HashSet::new();
    for path in &record.tabs {
        if !safe_session_tab(path) {
            return Err("Session contains an invalid Markdown path.".into());
        }
        if !unique.insert(path) {
            return Err("Session contains duplicate document paths.".into());
        }
    }
    if record
        .active
        .is_some_and(|index| index >= record.tabs.len())
    {
        return Err("Session has an invalid active document index.".into());
    }
    Ok(())
}
fn write_session(path: &Path, record: &SessionRecord) -> Result<(), String> {
    valid_session_paths(record)?;
    let contents = serde_json::to_vec(record).map_err(err)?;
    if contents.len() > 2 * 1024 * 1024 {
        return Err("Saved session is too large.".into());
    }
    let parent = path.parent().ok_or("Missing session directory.")?;
    fs::create_dir_all(parent).map_err(err)?;
    let mut temp = tempfile::NamedTempFile::new_in(parent).map_err(err)?;
    temp.write_all(&contents).map_err(err)?;
    temp.as_file().sync_all().map_err(err)?;
    temp.persist(path).map_err(err)?;
    Ok(())
}
fn read_session(path: &Path) -> Result<Option<LoadedSession>, String> {
    match fs::read(path) {
        Ok(bytes) => {
            if bytes.len() > 2 * 1024 * 1024 {
                return Err("Saved session is too large.".into());
            }
            let mut record: SessionRecord = serde_json::from_slice(&bytes).map_err(err)?;
            valid_session_workspace(&record)?;
            let original_active = record.active;
            let mut seen = std::collections::HashSet::new();
            let mut valid_tabs = Vec::new();
            let mut valid_active = None;
            let mut skipped = 0;
            for (index, tab) in record.tabs.into_iter().enumerate() {
                if index >= 500 || !safe_session_tab(&tab) || !seen.insert(tab.clone()) {
                    skipped += 1;
                    continue;
                }
                if original_active == Some(index) {
                    valid_active = Some(valid_tabs.len());
                }
                valid_tabs.push(tab);
            }
            record.tabs = valid_tabs;
            record.active = valid_active;
            Ok(Some(LoadedSession { record, skipped }))
        }
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(error) => Err(err(error)),
    }
}
fn save_document(
    root: &Path,
    relative: &str,
    content: &str,
    expected: &str,
) -> Result<String, String> {
    if content.len() as u64 > MAX_BYTES {
        return Err("File exceeds the 8 MiB limit.".into());
    }
    let path = resolve(root, relative)?;
    let before = read_bytes(&path)?;
    if revision(&before) != expected {
        return Err("This file changed on disk. Save was cancelled. Copy your changes or reload the disk version before retrying.".into());
    }
    // A same-directory temporary file + rename avoids truncating the destination on failure.
    let mut temp =
        tempfile::NamedTempFile::new_in(path.parent().ok_or("Missing parent")?).map_err(err)?;
    temp.as_file()
        .set_permissions(fs::metadata(&path).map_err(err)?.permissions())
        .map_err(err)?;
    temp.write_all(content.as_bytes()).map_err(err)?;
    temp.as_file().sync_all().map_err(err)?;
    if resolve(root, relative)? != path || revision(&read_bytes(&path)?) != expected {
        return Err("File changed while saving; no changes were written.".into());
    }
    temp.persist(&path).map_err(err)?;
    Ok(revision(content.as_bytes()))
}
fn create_document(root: &Path, selected: &Path) -> Result<CreateResult, String> {
    let parent = selected.parent().ok_or("Missing document directory.")?;
    let parent = parent.canonicalize().map_err(err)?;
    if !parent.starts_with(root) || !parent.is_dir() {
        return Err("Choose a directory inside the workspace.".into());
    }
    let name = selected
        .file_name()
        .and_then(|v| v.to_str())
        .ok_or("Invalid document name.")?;
    if name.is_empty() || name == "." || name == ".." || name.contains('/') || name.contains('\\') {
        return Err("Choose a valid Markdown filename.".into());
    }
    let extension = selected.extension().and_then(|v| v.to_str()).unwrap_or("");
    let destination = if extension.is_empty() {
        selected.with_extension("md")
    } else if matches!(extension.to_ascii_lowercase().as_str(), "md" | "markdown") {
        selected.to_path_buf()
    } else {
        return Err("Only .md and .markdown files can be created.".into());
    };
    if fs::symlink_metadata(&destination)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err("Symbolic links are not supported for workspace files.".into());
    }
    let relative = destination
        .strip_prefix(root)
        .map_err(err)?
        .to_string_lossy()
        .into_owned();
    if destination.exists() {
        if markdown(&destination) {
            return Ok(CreateResult::ExistingMarkdown(relative));
        }
        return Err("A file already exists at that location.".into());
    }
    fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&destination)
        .map_err(err)?;
    Ok(CreateResult::Created(relative))
}
#[tauri::command]
fn create_markdown_document(
    app: tauri::AppHandle,
    state: State<'_, Workspace>,
) -> Result<(), String> {
    let root = state
        .0
        .lock()
        .map_err(err)?
        .clone()
        .ok_or("Open a workspace first.")?;
    let selected_root = root.clone();
    app.dialog()
        .file()
        .set_title("New Markdown document")
        .set_directory(root.to_string_lossy().as_ref())
        .save_file(move |selected| {
            let event = match selected {
                None => CreateEvent {
                    result: None,
                    error: None,
                },
                Some(selected) => match selected.into_path() {
                    Ok(path) => match create_document(&selected_root, &path) {
                        Ok(result) => CreateEvent {
                            result: Some(result),
                            error: None,
                        },
                        Err(error) => CreateEvent {
                            result: None,
                            error: Some(error),
                        },
                    },
                    Err(error) => CreateEvent {
                        result: None,
                        error: Some(err(error)),
                    },
                },
            };
            let _ = app.emit("new-document-result", event);
        });
    Ok(())
}
#[tauri::command]
async fn choose_workspace(
    app: tauri::AppHandle,
    state: State<'_, Workspace>,
) -> Result<Option<String>, String> {
    let selected = app
        .dialog()
        .file()
        .set_title("Open a Markdown workspace")
        .blocking_pick_folder();
    let Some(selected) = selected else {
        return Ok(None);
    };
    let root = selected
        .into_path()
        .map_err(err)?
        .canonicalize()
        .map_err(err)?;
    if !root.is_dir() {
        return Err("Select a directory.".into());
    }
    let label = root.to_string_lossy().into_owned();
    *state.0.lock().map_err(err)? = Some(root);
    Ok(Some(label))
}
#[tauri::command]
fn load_session(store: State<'_, SessionStore>) -> Result<Option<LoadedSession>, String> {
    let guard = store.0.lock().map_err(err)?;
    read_session(guard.as_ref().ok_or("Session storage is unavailable.")?)
}
#[tauri::command]
fn save_session(record: SessionRecord, store: State<'_, SessionStore>) -> Result<(), String> {
    let guard = store.0.lock().map_err(err)?;
    write_session(
        guard.as_ref().ok_or("Session storage is unavailable.")?,
        &record,
    )
}
#[tauri::command]
fn restore_workspace(path: String, state: State<'_, Workspace>) -> Result<String, String> {
    let requested = PathBuf::from(path);
    let root = requested.canonicalize().map_err(err)?;
    if root != requested || !root.is_dir() {
        return Err("The saved workspace is not a directory.".into());
    }
    let label = root.to_string_lossy().into_owned();
    *state.0.lock().map_err(err)? = Some(root);
    Ok(label)
}
#[tauri::command]
fn list_directory(path: String, state: State<'_, Workspace>) -> Result<Vec<Entry>, String> {
    let guard = state.0.lock().map_err(err)?;
    let root = guard.as_ref().ok_or("Open a workspace first.")?;
    list_entries(root, &path)
}
fn list_entries(root: &Path, path: &str) -> Result<Vec<Entry>, String> {
    let directory = resolve(root, &path)?;
    let mut entries = Vec::new();
    for entry in fs::read_dir(directory).map_err(err)? {
        let entry = entry.map_err(err)?;
        let kind = entry.file_type().map_err(err)?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.')
            || matches!(name.as_str(), "node_modules" | "target" | "dist")
            || kind.is_symlink()
        {
            continue;
        }
        if kind.is_dir() || (kind.is_file() && markdown(&entry.path())) {
            entries.push(Entry {
                name,
                path: entry
                    .path()
                    .strip_prefix(root)
                    .map_err(err)?
                    .to_string_lossy()
                    .into_owned(),
                directory: kind.is_dir(),
            });
        }
    }
    entries.sort_by(|a, b| {
        b.directory
            .cmp(&a.directory)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
    Ok(entries)
}
#[tauri::command]
async fn workspace_snapshot(state: State<'_, Workspace>) -> Result<connections::Snapshot, String> {
    let root = state
        .0
        .lock()
        .map_err(err)?
        .clone()
        .ok_or("Open a workspace first.")?;
    tauri::async_runtime::spawn_blocking(move || connections::scan(&root))
        .await
        .map_err(err)?
}
#[tauri::command]
async fn check_reference_targets(
    paths: Vec<String>,
    state: State<'_, Workspace>,
) -> Result<Vec<connections::Target>, String> {
    if paths.len() > 10_000 {
        return Err("Too many reference targets.".into());
    }
    let root = state
        .0
        .lock()
        .map_err(err)?
        .clone()
        .ok_or("Open a workspace first.")?;
    tauri::async_runtime::spawn_blocking(move || {
        paths
            .into_iter()
            .map(|path| connections::check_target(&root, path))
            .collect()
    })
    .await
    .map_err(err)
}
#[tauri::command]
fn open_document(path: String, state: State<'_, Workspace>) -> Result<Document, String> {
    let guard = state.0.lock().map_err(err)?;
    read_document(guard.as_ref().ok_or("Open a workspace first.")?, &path)
}
#[tauri::command]
fn write_document(
    path: String,
    content: String,
    expected_revision: String,
    state: State<'_, Workspace>,
) -> Result<String, String> {
    let guard = state.0.lock().map_err(err)?;
    save_document(
        guard.as_ref().ok_or("Open a workspace first.")?,
        &path,
        &content,
        &expected_revision,
    )
}
struct TabMenu {
    all: tauri::menu::MenuItem<tauri::Wry>,
    others: tauri::menu::MenuItem<tauri::Wry>,
}

#[tauri::command]
fn set_tab_menu_state(state: State<'_, TabMenu>, all: bool, others: bool) -> Result<(), String> {
    state.all.set_enabled(all).map_err(err)?;
    state.others.set_enabled(others).map_err(err)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Workspace::default())
        .setup(|app| {
            let session_path = app.path().app_config_dir()?.join("session.json");
            app.manage(SessionStore(Mutex::new(Some(session_path))));
            use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
            let quit = MenuItemBuilder::with_id("safe-quit", "Quit SpecSpace")
                .accelerator("CmdOrCtrl+Q")
                .build(app)?;
            let app_menu = SubmenuBuilder::new(app, "SpecSpace")
                .about(None)
                .separator()
                .hide()
                .hide_others()
                .separator()
                .item(&quit)
                .build()?;
            let open_folder = MenuItemBuilder::with_id("open-folder", "Open Folder…")
                .accelerator("CmdOrCtrl+O")
                .build(app)?;
            let new_document = MenuItemBuilder::with_id("new-document", "New Markdown Document…")
                .accelerator("CmdOrCtrl+N")
                .build(app)?;
            let close_all = MenuItemBuilder::with_id("close-all-tabs", "Close All Tabs")
                .enabled(false)
                .build(app)?;
            let close_others = MenuItemBuilder::with_id("close-other-tabs", "Close Other Tabs")
                .enabled(false)
                .build(app)?;
            app.manage(TabMenu {
                all: close_all.clone(),
                others: close_others.clone(),
            });
            let file = SubmenuBuilder::new(app, "File")
                .item(&new_document)
                .item(&open_folder)
                .separator()
                .item(&close_all)
                .item(&close_others)
                .build()?;
            let edit = SubmenuBuilder::new(app, "Edit")
                .undo()
                .redo()
                .separator()
                .cut()
                .copy()
                .paste()
                .select_all()
                .build()?;
            app.set_menu(
                MenuBuilder::new(app)
                    .items(&[&app_menu, &file, &edit])
                    .build()?,
            )?;
            app.on_menu_event(|app, event| {
                if event.id() == "open-folder" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("open-folder-requested", ());
                    }
                }
                if event.id() == "new-document" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.emit("new-document-requested", ());
                    }
                }
                if event.id() == "close-all-tabs" || event.id() == "close-other-tabs" {
                    if let Some(window) = app.get_webview_window("main") {
                        let scope = if event.id() == "close-all-tabs" {
                            "all"
                        } else {
                            "others"
                        };
                        let _ = window.emit("close-tabs-requested", scope);
                    }
                }
                if event.id() == "safe-quit" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.close();
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            image_export::save_diagram_png,
            image_export::copy_diagram_image,
            set_tab_menu_state,
            load_session,
            save_session,
            restore_workspace,
            choose_workspace,
            create_markdown_document,
            list_directory,
            open_document,
            workspace_snapshot,
            check_reference_targets,
            write_document
        ])
        .build(tauri::generate_context!())
        .expect("Unable to launch SpecSpace")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                if let Some(window) = app.get_webview_window("main") {
                    api.prevent_exit();
                    let _ = window.close();
                }
            }
        });
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn session_round_trip_and_rejects_unsafe_metadata() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("config/session.json");
        let record = SessionRecord {
            workspace: "/tmp/specspace-test".into(),
            tabs: vec!["a.md".into(), "nested/b.markdown".into()],
            active: Some(1),
        };
        write_session(&path, &record).unwrap();
        assert_eq!(
            read_session(&path).unwrap(),
            Some(LoadedSession { record, skipped: 0 })
        );
        let unsafe_record = SessionRecord {
            workspace: "/tmp/specspace-test".into(),
            tabs: vec!["../outside.md".into()],
            active: Some(4),
        };
        assert!(valid_session_paths(&unsafe_record).is_err());
        assert!(write_session(&path, &unsafe_record).is_err());
        fs::write(&path, serde_json::to_vec(&unsafe_record).unwrap()).unwrap();
        let loaded = read_session(&path).unwrap().unwrap();
        assert_eq!(loaded.skipped, 1);
        assert!(loaded.record.tabs.is_empty());
    }
    #[test]
    fn round_trip_and_conflict() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        let original = "\u{feff}---\r\ntitle: Test\r\n---\r\n<!-- preserve -->\n```mermaid\ngraph TD; A-->B\n```\n";
        fs::write(root.join("spec.md"), original).unwrap();
        let doc = read_document(&root, "spec.md").unwrap();
        save_document(&root, "spec.md", &doc.content, &doc.revision).unwrap();
        assert_eq!(fs::read(root.join("spec.md")).unwrap(), original.as_bytes());
        fs::write(root.join("spec.md"), "external merge").unwrap();
        assert!(save_document(&root, "spec.md", "my edit", &doc.revision).is_err());
        assert_eq!(
            fs::read_to_string(root.join("spec.md")).unwrap(),
            "external merge"
        );
    }
    #[test]
    fn rejects_escape_and_invalid_files() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        assert!(resolve(&root, "../escape.md").is_err());
        assert!(resolve(&root, "/etc/passwd").is_err());
        fs::write(root.join("bad.md"), [0xff, 0xfe]).unwrap();
        assert!(read_document(&root, "bad.md").is_err());
        fs::write(root.join("binary.md"), [0, 1]).unwrap();
        assert!(read_document(&root, "binary.md").is_err());
        fs::write(root.join("secret.txt"), "secret").unwrap();
        assert!(read_document(&root, "secret.txt").is_err());
    }
    #[cfg(unix)]
    #[test]
    fn rejects_symlinks() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        std::os::unix::fs::symlink("/tmp", root.join("escape")).unwrap();
        assert!(resolve(&root, "escape").is_err());
    }
    #[test]
    fn creates_markdown_without_overwriting() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        assert!(
            matches!(create_document(&root, &root.join("new-spec")), Ok(CreateResult::Created(path)) if path == "new-spec.md")
        );
        assert_eq!(fs::read(root.join("new-spec.md")).unwrap(), b"");
        fs::write(root.join("existing.md"), "keep").unwrap();
        assert!(
            matches!(create_document(&root, &root.join("existing.md")), Ok(CreateResult::ExistingMarkdown(path)) if path == "existing.md")
        );
        assert_eq!(
            fs::read_to_string(root.join("existing.md")).unwrap(),
            "keep"
        );
        assert!(create_document(&root, &root.join("bad.txt")).is_err());
    }
}
