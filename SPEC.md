# SpecSpace — producto vigente

Estado: baseline implementada, documentada el 2026-10-17.
Esta especificación describe el MVP existente; no implica una aceptación retrospectiva de un proceso SDD que todavía no existía.
Es la fuente de verdad del comportamiento vigente. Las propuestas viven en `specs/` hasta implementarse y validarse.

## Propósito y modelo de documentos

Editor desktop local de especificaciones técnicas para macOS. Un workspace es una carpeta elegida por el usuario; cada documento es un archivo UTF-8 `.md` o `.markdown` existente. Una pestaña mantiene su texto, versión guardada y revisión en disco. Los diagramas Mermaid son bloques del mismo Markdown, no documentos separados. No hay base de datos ni formato propietario.

## Funcionalidad vigente

La apertura principal es **File → Open Folder…** (⌘O), en el menú nativo. No existe el botón superior derecho. Se conserva la apertura desde la bienvenida y la barra de pestañas.

- Native folder picker; lazily expanded directory explorer with refresh and filename filtering within expanded folders.
- Multiple document tabs, dirty indicators, independent editor undo histories, and source / split / preview layouts.
- CodeMirror Markdown editing with line numbers, syntax highlighting, search, undo/redo, and line wrapping.
- GitHub-flavored Markdown preview with tables, task lists, fenced code, and debounced Mermaid rendering with inline errors.
- Relative Markdown links navigate within the workspace.
- Explicit save, reload from disk, and save/discard/cancel protection on tab close, workspace switch, window close, and normal application quit.
- `⌘O` open workspace, `⌘S` save, `⌘W` close current tab, `⌘Q` quit; CodeMirror's `⌘F` searches the active document.

## Content and filesystem guarantees

Markdown source is never reconstructed from the preview. Frontmatter, comments, unknown syntax, UTF-8 BOM, final newline presence, and untouched line endings remain in the source. Inserted newlines use the document's first line ending; existing mixed line endings remain intact outside edited ranges.

The Rust backend owns the selected workspace. It accepts only relative paths, checks canonical containment, rejects symlink path components, and permits reads/writes only to existing `.md`/`.markdown` files. Invalid UTF-8, binary content, and documents over 8 MiB are rejected. Hidden files and build/dependency directories are omitted from the explorer.

A save checks a SHA-256 revision against the current file, writes and syncs a same-directory temporary file, checks the revision again, and atomically replaces the destination, preserving Unix permission bits. A conflict leaves both the editor and existing disk file untouched. Copy your edits somewhere safe or explicitly reload the disk version; remote merges remain your responsibility. This is optimistic concurrency: another process writing in the tiny interval between the final check and rename cannot be locked out. Atomic replacement does not preserve hard-link identity or all extended filesystem metadata.

Preview HTML is disabled. Mermaid uses strict mode and sanitized SVG; image and navigation elements are removed from diagrams. Remote images, arbitrary external links, and embedded resources are disabled. No general-purpose filesystem or shell permission is granted to the webview.

## Límites actuales

Existing files only: create, rename, and delete files using Finder or your existing tools, then refresh. There is no auto-save, crash recovery, session restore, file watcher, Git UI, cloud sync, or remote collaboration. A clean open tab does not automatically refresh after external edits; use **Reload from disk**. Force quit and power loss cannot show a pending-change prompt. Images and non-Markdown attachments are not rendered yet. Scroll positions in source and preview are independent. Frontmatter stays editable in source and is omitted from the rendered preview; there is no separate metadata UI.

## Criterios de aceptación de la baseline

- Abrir una carpeta y navegar documentos en pestañas sin modificar archivos por abrirlos.
- Editar, guardar y reabrir el contenido; conservar sintaxis y texto no editado.
- Renderizar Markdown y Mermaid; mostrar errores del diagrama sin perder el editor.
- Rechazar una escritura si cambió la revisión en disco; mantener los cambios en memoria.
- Ofrecer guardar, descartar o cancelar ante cambios pendientes al cerrar o cambiar workspace.
- Rechazar traversal, symlinks, archivos no UTF-8 y operaciones fuera del workspace.

La evidencia disponible y sus límites se registran en [PROJECT_STATUS.md](PROJECT_STATUS.md).
