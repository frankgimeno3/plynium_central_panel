# RDS schema reference (must keep updated)

These SQL migrations are the **canonical** source of the shared RDS schema.

To help agents write correct SQL and avoid “drift” between code assumptions and the real DB, the repo maintains a human-readable schema snapshot:

- **Schema snapshot (public):** `docs/RDS_SCHEMA.md`

---

## Rule (Definition of Done for migrations)

When you add or modify anything under `server/database/migrations/` that changes the schema (tables/columns/types/nullability/defaults/enums), you must:

1. Update the migration SQL (idempotent DDL).
2. Update **`docs/RDS_SCHEMA.md`** so it matches the new schema.

If you don’t update the schema snapshot, the migration is **not** considered complete.

