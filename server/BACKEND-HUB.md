# Backend hub

Backend = `createEndpoint` + `errorHandler` + DB + features. API routes live in `app/api/` but **all logic** is here. Use this doc to know where to look and what not to break.

---

## Qué contiene

- **Routing (1–2 jumps):** Tabla “necesitas X → abre Y” dentro del backend.
- **Contratos:** createEndpoint (firma, callback, schema, isProtected, roles, side effects) y errorHandler (errores conocidos vs 500).
- **Entrada DB y features:** Dónde está la conexión y el índice de dominios.
- **Decisiones y gotchas:** Enlaces a secciones y trampas conocidas.

---

## Dónde está qué (rutas)

| Qué | Dónde |
|-----|--------|
| Factory de handlers API, auth, roles | `server/createEndpoint.js` |
| Mapeo error → HTTP | `server/errorHandler.js` |
| Conexión, modelos, asociaciones, migraciones | `server/database/` → [database/DATABASE.md](database/DATABASE.md) |
| Lógica por dominio (article, user, timeLog, etc.) | `server/features/` → [features/FEATURES-INDEX.md](features/FEATURES-INDEX.md) |
| Inicio de DB al arrancar Node | Root `instrumentation-node.js` |

---

## Si vas a cambiar X → abre Y

| Si cambias… | Abre primero | Luego si hace falta |
|-------------|--------------|----------------------|
| Contrato de un handler (auth, validación, roles) | Sección [Contract: createEndpoint](#contract-createendpoint) + `createEndpoint.js` | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) (rutas) |
| Mapeo de un error a status HTTP | `errorHandler.js` + clase del feature | [Contract: errorHandler](#contract-errorhandler) |
| Conexión o schema DB | [database/DATABASE.md](database/DATABASE.md) | `database/database.js`, `database/models.js`, `database/migrations/` |
| Lógica de un dominio | [features/FEATURES-INDEX.md](features/FEATURES-INDEX.md) | Carpeta del feature (ej. `features/article/`) |

---

## Contratos clave / invariantes globales

- **Rutas en app/api:** Solo llaman a `createEndpoint` y a servicios/repos de `server/features/`. Cero acceso directo a DB.
- **createEndpoint:** Validación (Joi) → auth si isProtected → roles si roles.length > 0 → callback. Cualquier error lanzado → errorHandler.
- **errorHandler:** Solo los errores importados y comprobados aquí tienen status distinto de 500. Cualquier otro → 500 + requestId (y stack en dev).

---

## Decisiones (links a secciones)

| Decisión | Dónde |
|----------|--------|
| Validación con Joi; GET = query, resto = body/formData | [Contract: createEndpoint](#contract-createendpoint) |
| Roles vía Cognito groups; fallback custom:role del token | [Contract: createEndpoint](#contract-createendpoint) |
| Nuevos errores de dominio hay que mapearlos en errorHandler | [Contract: errorHandler](#contract-errorhandler) |
| Tablas sin modelo → raw SQL en features | [database/DATABASE.md](database/DATABASE.md) |

---

## Contract: createEndpoint

**Signature:** `createEndpoint(callback, schema = null, isProtected = false, roles = [])`

- **callback(request, body):** Async. Receives `request` (plus `request.email`, `request.sub`, `request.tokenPayload` if protected) and validated `body`. Must return `NextResponse` (e.g. `NextResponse.json(...)`). Thrown errors go to `errorHandler`.
- **schema:** Joi. GET → validated from query params; POST/PUT/etc. → from JSON body or `multipart/form-data` (parsed to plain object). If validation fails → 400 with message.
- **isProtected:** If true, requires Cognito cookies; verifies id + access token; on failure refreshes with refresh token. Sets `request.email`, `request.sub`, `request.tokenPayload`. If no valid session → 400.
- **roles:** Array of strings (e.g. `['admin']`). After auth, `AuthorizationService.getUserRoles(username)`; if no role in list → 403. Fallback: if Cognito groups empty, uses `tokenPayload['custom:role']` or `tokenPayload.role`.

**Side effects:** On token refresh, response may set refreshed id/access cookies (same keys, `SESSION_COOKIE_MAX_AGE` cap).

**GOTCHA:** Validation error messages are currently in Spanish (“Solicitud no paso validacion”, “Falta cookie con el nombre de usuario”). Changing to English would require updating these strings and any client that parses them.

---

## Contract: errorHandler

**Signature:** `errorHandler(error)` → `NextResponse` (JSON).

- **Known errors (mapped):** `TimeLogNotFound` → 404; Cognito `InvalidPasswordException`, `InvalidParameterException`, `UsernameExistsException` → 400.
- **Unknown:** Logged; 500 with `message` (+ `requestId`; in dev also `error`, `details` with stack). DB connection errors get extra log context.

**Decision:** New domain errors (e.g. `ArticleNotFound`) must be defined in the feature and **added here** to get the right status. Otherwise they become 500.

**Ownership:** `errorHandler` owns the mapping. Features own the error classes.

---

## DB entry

- **Connection:** `Database.getInstance()`, `getSequelize()`, `connect()` — from [database/DATABASE.md](database/DATABASE.md). Loaded at Node startup via root `instrumentation-node.js`.
- **Models:** Registered in `database/models.js`; associations in `database/associations.js`. Tables only in migrations (e.g. `portals`, `users`, link tables) have **no** Sequelize model; features use raw SQL (e.g. `PortalService`).

---

## Features (domain logic)

One folder per domain under `server/features/`. Each typically: Model (if in `models.js`), Service, optional enums/errors. **Index and ownership:** [features/FEATURES-INDEX.md](features/FEATURES-INDEX.md).

**Rule:** API routes in `app/api/` must **only** call server (createEndpoint + feature services/repositories). No direct DB in routes.

---

## Cómo probar / validar

- **Handlers protegidos:** Llamar sin cookies → 400; con cookies válidas → 200/201 según endpoint. Con rol incorrecto → 403.
- **Errores conocidos:** Provocar TimeLogNotFound (ej. GET a time-log inexistente si existe ruta) → 404. Provocar error de Cognito (ej. usuario ya existe) → 400.
- **Errores desconocidos:** Provocar una excepción no mapeada en un handler → 500 con requestId; en dev, comprobar que el stack aparece en la respuesta.
- **DB:** Con env de DB vacío, la app puede arrancar (Sequelize null); con env correcto, las rutas que usan DB deben responder. Migraciones: ejecutarlas a mano o en CI y comprobar que el schema coincide con lo que usan los features.
