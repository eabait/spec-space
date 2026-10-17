# Arquitectura actual

Baseline: 2026-10-17. Aplicación local Tauri 2, React 19, TypeScript y Vite.

## Componentes y límites

| Componente                                    | Responsabilidad                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/App.tsx`                                 | Workspace, explorador lazy, pestañas, modos, prompts y coordinación de comandos |
| `src/Editor.tsx`                              | Instancias CodeMirror 6, historial por pestaña y eventos de edición             |
| `src/text.ts`                                 | Aplicación de cambios sobre texto original y resolución de enlaces relativos    |
| `src/Preview.tsx`                             | React Markdown, GFM, frontmatter omitido, Mermaid en cola y SVG sanitizado      |
| `src/styles.css`                              | Presentación y adaptación de layout                                             |
| `src-tauri/src/lib.rs`                        | Workspace autorizado, selector nativo, lectura, guardado, menús y cierre        |
| `src-tauri/tauri.conf.json`                   | Ventana, CSP y empaquetado                                                      |
| `src-tauri/capabilities/default.json`         | Capacidades mínimas de ventana                                                  |
| `tests/text.test.ts` y tests Rust en `lib.rs` | Preservación de texto, enlaces y límites de filesystem                          |

## Datos y operaciones

Rust mantiene `Mutex<Option<PathBuf>>`: una raíz canonicalizada seleccionada por diálogo nativo. React mantiene documentos abiertos con `content`, `saved`, `revision` y una generación para recrear el editor al recargar. No se persiste sesión ni se usa base de datos.

Comandos IPC: `choose_workspace`, `list_directory`, `open_document`, `write_document`. React no dispone de una API general de filesystem. Rust resuelve rutas relativas, rechaza componentes symlink y exige contención en la raíz.

La apertura devuelve texto UTF-8 y SHA-256. El editor aplica cambios al texto original conservando BOM y finales no editados. Guardar comprueba revisión, escribe y sincroniza un temporal junto al destino, vuelve a comprobar y renombra. Hay una ventana de concurrencia entre comprobación y rename; no se promete bloqueo contra escritores externos.

## Menús y ciclo de vida

File → Open Folder… emite `open-folder-requested` a la ventana principal. El listener React usa el mismo flujo protegido de apertura que la bienvenida. ⌘O se registra nativamente; el handler web es solo fallback de navegador. Cierre y salida pasan por la protección de documentos sucios. Force quit no puede proteger cambios en memoria.

## Preview y seguridad

La vista previa no modifica el fuente. HTML deshabilitado; Mermaid en modo estricto con etiquetas SVG y DOMPurify; diagramas sin enlaces, imágenes ni foreignObject. CSP restringe recursos remotos. El alcance exacto y límites funcionales están en SPEC.

## Mantenibilidad

App y lib concentran actualmente la coordinación del MVP. Separar gestión de workspace, pestañas o servicio de archivos cuando un incremento lo necesite; no introducir capas por anticipación. Nuevas reglas de disco pertenecen a Rust y nuevas transformaciones de texto deben conservar pruebas de preservación.
