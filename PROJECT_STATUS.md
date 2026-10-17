# Estado del proyecto — empezar aquí

Actualizado: 2026-10-17. SpecSpace Desktop 0.1.0, MVP local macOS.

## Lectura de continuidad

Leer [AGENTS.md](AGENTS.md), [VISION.md](VISION.md), [SPEC.md](SPEC.md), [ARCHITECTURE.md](ARCHITECTURE.md) y [SDD.md](SDD.md); luego el incremento pertinente de [specs](specs/README.md) y [plans](plans/README.md).

## Estado real

- MVP implementado: carpetas locales, pestañas, CodeMirror, preview Markdown/Mermaid, guardado y protección de cambios pendientes.
- Apertura principal nativa File → Open Folder… con ⌘O; botón superior derecho eliminado.
- Baseline documentada; no hay incremento SDD activo ni próximo desarrollo aceptado.
- Repositorio: `/Users/estebanabait/Documents/Projects/spec-space` (Projects en plural).
- Baseline inicial en main, identificada por el tag anotado `v0.1.0` (release local 0.1). Consultar `git log -1` y `git status` al retomar.

## Evidencia de validación

- MVP: 5 tests TypeScript y 3 tests Rust aprobados; build frontend y bundle macOS release aprobados.
- Pruebas nativas: carpeta, pestañas, edición, guardado, avisos de cierre; preview y etiquetas Mermaid revisados visualmente.
- Cambio de menú: compilación release y formato aprobados; File → Open Folder… comprobado en la app, abre el selector.
- Se detectaron instancias antiguas debug/release: verificar la versión abierta al validar. Bundle actual: `src-tauri/target/release/bundle/macos/SpecSpace.app`.
- Rust se instaló temporalmente en `/private/tmp`; instrucciones en README. No asumir que sigue disponible.

## Límites y siguiente paso

No hay creación de archivos, autosave, recuperación de sesión, watcher, Git UI ni colaboración. Ver SPEC para límites de guardado y preview.

El siguiente cambio debe comenzar con `specs/001-<nombre>.md`, aceptar su alcance y crear el plan homónimo antes de implementar. No hay prioridad funcional acordada: definirla con el usuario. No publicar ni crear commits como parte implícita de la documentación.

## Última tarea

El usuario solicitó el commit inicial y marcar la release 0.1. Se conserva la versión técnica 0.1.0 y se identifica con el tag anotado `v0.1.0`. Alcance: MVP y documentación SDD. No se publica una release de GitHub ni se hace push en esta tarea. Se excluyen dependencias, bundles y esquemas generados de Tauri del control de versiones. Las validaciones nativas indicadas arriba corresponden a tareas previas.
