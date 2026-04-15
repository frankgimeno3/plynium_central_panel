# Migraciones SQL

Fuente canónica del esquema RDS compartido por **plynium_central_panel** y portales (p. ej. **portals/glassinformer**): no duplicar DDL en los portales; aplicar aquí y desplegar contra la misma base.

Ejecutar en orden numérico (000 es opcional, solo lectura). El esquema canónico está **compactado** para que se entienda leyendo pocos archivos.

| # | Archivo | Descripción |
|---|---------|-------------|
| 000 | `000_id_consistency_audit.sql` | Solo lectura: auditar tablas esperadas/extra + tipos PK/FK |
| 065 | `065_bootstrap_core_schema.sql` | **Bootstrap canónico**: crea el esquema final (tablas/columnas/constraints/índices/functions/triggers/views de compatibilidad) en una RDS nueva |

Todas las migraciones son idempotentes (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS donde aplica).
