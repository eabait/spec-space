# Flujo SDD

## Ciclo de un cambio

1. Retomar desde PROJECT_STATUS e inspeccionar el repositorio.
2. Definir problema, alcance, exclusiones y relación con VISION.
3. Escribir `specs/NNN-nombre.md` como **Propuesta** con criterios verificables.
4. Registrar aceptación explícita del usuario (fecha y referencia o síntesis fiel); pasar a **Aceptada**. Si faltan decisiones, dejarlas abiertas, no inventarlas.
5. Crear `plans/NNN-nombre.md` con secuencia, archivos afectados, riesgos y validación. Una SPEC aceptada no se implementa sin este plan.
6. Implementar dentro del contrato. Cambios materiales de alcance vuelven a propuesta y aceptación; decisiones técnicas rutinarias se resuelven en el plan.
7. Validar y registrar resultados reales, incluyendo lo que no pudo comprobarse.
8. Marcar **Implementada** solo tras satisfacer sus criterios. Actualizar SPEC, ARCHITECTURE cuando corresponda y PROJECT_STATUS antes del cierre.

## Estados y trazabilidad

SPEC: Propuesta → Aceptada → En implementación → Implementada. Puede quedar Rechazada o Sustituida, conservando motivo y enlace al reemplazo.
Plan: Pendiente → En curso → Completado; usar Bloqueado con causa y siguiente acción.
Usar el mismo número y nombre en ambos archivos. Elegir el siguiente número libre inspeccionando los directorios, sin renumerar historia. Registrar fecha y evidencia de transiciones; no usar casillas completadas como sustituto de resultados.

La baseline en SPEC describe trabajo previo al proceso: no fabricar SPECs históricas ni aceptaciones retrospectivas. Este flujo aplica a los próximos incrementos. Una corrección de documentación sin cambio de contrato puede hacerse directamente y registrarse en PROJECT_STATUS; un cambio de comportamiento, incluso un bugfix, lleva incremento proporcional a su tamaño.

## Validación proporcional

- Documentación: enlaces, coherencia con código, formato y límite de AGENTS.
- Frontend: pruebas relevantes, compilación, formato e interacción afectada.
- Archivos/guardado: pruebas Rust, preservación de texto, conflictos y límites de acceso.
- Menús o integración nativa: compilar Tauri y comprobar la app real actualizada.
- UI: revisar visualmente el estado y tamaño de ventana pertinentes.

No afirmar que una prueba histórica se ejecutó en la tarea actual. No ampliar pruebas sin una razón concreta. Comandos en README.
