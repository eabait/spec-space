use super::{err, list_entries, read_document, Document};
use serde::Serialize;
use std::path::Path;

const MAX_DOCUMENTS: usize = 500;
const MAX_TOTAL_BYTES: usize = 32 * 1024 * 1024;
const MAX_ENTRIES: usize = 10_000;
const MAX_DEPTH: usize = 64;

#[derive(Serialize)]
pub struct Issue {
    path: String,
    message: String,
}
#[derive(Serialize)]
pub struct Snapshot {
    documents: Vec<Document>,
    unavailable: Vec<Issue>,
    complete: bool,
}

pub fn scan(root: &Path) -> Result<Snapshot, String> {
    scan_with_limits(root, MAX_DOCUMENTS, MAX_TOTAL_BYTES, MAX_ENTRIES)
}

fn scan_with_limits(
    root: &Path,
    max_documents: usize,
    max_bytes: usize,
    max_entries: usize,
) -> Result<Snapshot, String> {
    let mut snapshot = Snapshot {
        documents: vec![],
        unavailable: vec![],
        complete: true,
    };
    let mut pending = vec![(String::new(), 0)];
    let mut bytes = 0;
    let mut entries_seen = 0;
    while let Some((directory, depth)) = pending.pop() {
        // Bound raw enumeration as well as eligible Markdown content.
        let count = match super::resolve(root, &directory).and_then(|resolved| {
            Ok(std::fs::read_dir(resolved)
                .map_err(err)?
                .take(max_entries.saturating_sub(entries_seen) + 1)
                .count())
        }) {
            Ok(count) => count,
            Err(message) if !directory.is_empty() => {
                snapshot.complete = false;
                snapshot.unavailable.push(Issue {
                    path: directory,
                    message,
                });
                continue;
            }
            Err(message) => return Err(message),
        };
        entries_seen += count;
        if entries_seen > max_entries {
            snapshot.complete = false;
            snapshot.unavailable.push(Issue {
                path: directory,
                message: "Scan stopped at the directory entry limit.".into(),
            });
            break;
        }
        let entries = match list_entries(root, &directory) {
            Ok(entries) => entries,
            Err(message) if !directory.is_empty() => {
                snapshot.complete = false;
                snapshot.unavailable.push(Issue {
                    path: directory,
                    message,
                });
                continue;
            }
            Err(message) => return Err(message),
        };
        for entry in entries {
            if entry.directory {
                if depth >= MAX_DEPTH {
                    snapshot.complete = false;
                    snapshot.unavailable.push(Issue {
                        path: entry.path,
                        message: "Directory depth limit reached.".into(),
                    });
                } else {
                    pending.push((entry.path, depth + 1));
                }
                continue;
            }
            if snapshot.documents.len() + snapshot.unavailable.len() >= max_documents {
                snapshot.complete = false;
                snapshot.unavailable.push(Issue {
                    path: entry.path,
                    message: "Scan stopped at the document limit (500).".into(),
                });
                return Ok(snapshot);
            }
            match read_document(root, &entry.path) {
                Ok(document) => {
                    bytes += document.content.len();
                    if bytes > max_bytes {
                        snapshot.complete = false;
                        snapshot.unavailable.push(Issue {
                            path: entry.path,
                            message: "Scan stopped at the total content limit (32 MiB).".into(),
                        });
                        return Ok(snapshot);
                    }
                    snapshot.documents.push(document);
                }
                Err(message) => snapshot.unavailable.push(Issue {
                    path: entry.path,
                    message,
                }),
            }
        }
    }
    snapshot.documents.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(snapshot)
}

#[derive(Serialize)]
pub struct Target {
    pub path: String,
    pub status: &'static str,
    pub canonical: Option<String>,
}

// Check absent targets through the same authorization boundary; never infer absence
// from a partial scan. Canonical paths also account for case-insensitive volumes.
pub fn check_target(root: &Path, path: String) -> Target {
    let excluded = path
        .split('/')
        .any(|p| p.starts_with('.') || matches!(p, "node_modules" | "target" | "dist"));
    let mut result = Target {
        path: path.clone(),
        status: "unavailable",
        canonical: None,
    };
    if excluded {
        result.status = "excluded";
        return result;
    }
    match super::resolve(root, &path) {
        Ok(resolved) => {
            if resolved.is_file() && super::markdown(&resolved) {
                result.canonical = resolved
                    .strip_prefix(root)
                    .ok()
                    .map(|p| p.to_string_lossy().into_owned());
            }
        }
        Err(_) => {
            // Walk components with symlink_metadata so a missing file can be
            // distinguished from an inaccessible or forbidden parent.
            let mut current = root.to_path_buf();
            for part in Path::new(&path).components() {
                let std::path::Component::Normal(name) = part else {
                    return result;
                };
                current.push(name);
                match std::fs::symlink_metadata(&current) {
                    Ok(meta) if meta.file_type().is_symlink() => {
                        result.status = "excluded";
                        return result;
                    }
                    Ok(meta) if current != root.join(&path) && !meta.is_dir() => {
                        result.status = "missing";
                        return result;
                    }
                    Ok(_) => {}
                    Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
                        result.status = "missing";
                        return result;
                    }
                    Err(_) => return result,
                }
            }
        }
    }
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    #[test]
    fn scans_nested_saved_markdown_and_reports_unreadable_content() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::create_dir(root.join("docs")).unwrap();
        fs::create_dir(root.join("node_modules")).unwrap();
        fs::write(root.join("a.md"), "[B](docs/b.markdown)").unwrap();
        fs::write(root.join("docs/b.markdown"), "# B").unwrap();
        fs::write(root.join("bad.md"), [0xff]).unwrap();
        fs::write(root.join("binary.md"), [0]).unwrap();
        fs::write(root.join(".hidden.md"), "hidden").unwrap();
        fs::write(root.join("node_modules/no.md"), "no").unwrap();
        let snapshot = scan(&root).unwrap();
        assert_eq!(
            snapshot
                .documents
                .iter()
                .map(|d| d.path.as_str())
                .collect::<Vec<_>>(),
            vec!["a.md", "docs/b.markdown"]
        );
        assert_eq!(snapshot.unavailable.len(), 2);
        assert!(snapshot.complete);
        assert_eq!(
            fs::read_to_string(root.join("a.md")).unwrap(),
            "[B](docs/b.markdown)"
        );
        assert_eq!(check_target(&root, "gone.md".into()).status, "missing");
        assert_eq!(check_target(&root, "bad.md".into()).status, "unavailable");
        assert_eq!(check_target(&root, ".hidden.md".into()).status, "excluded");
    }
    #[test]
    fn bounds_scanning_and_rebuilds_from_disk() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        fs::write(root.join("a.md"), "# A").unwrap();
        fs::write(root.join("b.md"), "# B").unwrap();
        assert!(!scan_with_limits(&root, 1, 100, 100).unwrap().complete);
        assert!(!scan_with_limits(&root, 100, 1, 100).unwrap().complete);
        assert!(!scan_with_limits(&root, 100, 100, 1).unwrap().complete);
        fs::write(root.join("a.md"), "changed").unwrap();
        assert_eq!(scan(&root).unwrap().documents[0].content, "changed");
    }
    #[cfg(unix)]
    #[test]
    fn never_reads_symlinks_or_outside_targets() {
        let dir = tempfile::tempdir().unwrap();
        let root = dir.path().canonicalize().unwrap();
        let outside = tempfile::tempdir().unwrap();
        fs::write(outside.path().join("secret.md"), "secret").unwrap();
        std::os::unix::fs::symlink(outside.path(), root.join("linked")).unwrap();
        std::os::unix::fs::symlink(outside.path().join("secret.md"), root.join("secret.md"))
            .unwrap();
        assert!(scan(&root).unwrap().documents.is_empty());
        assert_eq!(
            check_target(&root, "linked/secret.md".into()).status,
            "excluded"
        );
        assert_eq!(
            check_target(&root, "../secret.md".into()).status,
            "excluded"
        );
        assert_ne!(check_target(&root, "/etc/passwd".into()).status, "missing");
    }
}
