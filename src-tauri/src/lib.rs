use serde::Serialize;
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

const MAX_BYTES: u64 = 8 * 1024 * 1024;
#[derive(Default)]
struct Workspace(Mutex<Option<PathBuf>>);
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
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Workspace::default())
        .setup(|app| {
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
            let file = SubmenuBuilder::new(app, "File")
                .item(&open_folder)
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
                if event.id() == "safe-quit" {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.close();
                    }
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            choose_workspace,
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
}
