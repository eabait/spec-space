# SpecSpace — entrada para agentes y colaboradores

## Retomar una tarea

1. Leer [PROJECT_STATUS.md](PROJECT_STATUS.md): estado, evidencia y siguiente paso.
2. Inspeccionar `git status --short --branch` y cambios locales; preservar trabajo existente.
3. Leer [VISION.md](VISION.md), [SPEC.md](SPEC.md) y [ARCHITECTURE.md](ARCHITECTURE.md).
4. Buscar el incremento relevante en [specs/](specs/README.md) y su [plan](plans/README.md).
5. Seguir el [flujo SDD](SDD.md); el repositorio prevalece sobre recuerdos de chats.

## Fuentes de verdad

- VISION: norte revisable, no promesas de implementación.
- SPEC: producto vigente, no propuestas futuras.
- ARCHITECTURE: implementación actual y límites entre componentes.
- specs/: contratos incrementales y decisiones de aceptación.
- plans/: pasos y evidencia de ejecución de cada incremento.
- PROJECT_STATUS: punto de entrada para una tarea nueva; mantenerlo breve y actual.
- [README](README.md): instalación, ejecución y comandos de validación.

## Convenciones esenciales

- No implementar un incremento sin SPEC aceptada y plan registrado.
- La aceptación debe provenir del usuario; no inferirla del estado del código.
- No volver a pedir autorización que ya esté explícita en la tarea; registrar la evidencia.
- No descartar, sobrescribir ni consolidar cambios ajenos sin autorización.
- No publicar, notarizar ni desplegar por defecto. Validar localmente.
- TypeScript estricto, React funcional, Prettier y `cargo fmt`.
- Nombres de código en inglés; documentación de gestión en español.
- React gestiona interacción; Rust valida acceso a disco y guardado.
- Preservar Markdown fuente; nunca guardar una conversión de la vista previa.
- No ampliar permisos del webview ni cargar recursos remotos sin un contrato explícito.
- Preferir responsabilidades pequeñas y extraer módulos cuando el cambio lo justifique.
- Probar comportamiento y riesgos reales, no detalles internos de implementación.
- Verificar qué ejecutable está abierto antes de validar macOS: debug y release pueden coexistir.
- No cerrar sesiones con trabajo del usuario para probar una compilación.

## Divulgación progresiva

Este archivo debe mantenerse por debajo de 100 líneas. Leer documentos específicos según la tarea, no todo el repositorio de forma indiscriminada. Crear `CODING_CONVENTIONS.md`, `BEST_PRACTICES.md` u otras guías solo cuando haya reglas concretas que no quepan aquí; enlazarlas desde esta entrada y evitar duplicaciones.
