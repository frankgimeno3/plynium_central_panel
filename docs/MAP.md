# Project map (hub)

Single entry for “where do I look?” and “why is it like this?”. Optimized for **routing** (1–2 jumps) and **semantic density** (rules, not descriptions).

---

## Qué contiene

- **Architecture by domains:** Next app, API layer, auth/session, backend, DB, client data, logged area — and what each owns.
- **Route table:** Where each concern lives (paths and doc links).
- **Si vas a cambiar X → abre Y:** Table that sends you to the right doc or code.
- **Global decisions:** Auth, API, DB, frontend data, naming — with links to sections below.
- **Doc index:** The narrow tree of all maintained docs.

---

## Dónde está qué (rutas)

| Area | Path | Doc (if any) |
|------|------|--------------|
| Constitution, agent behaviour | Root | [AGENTS.md](../AGENTS.md) |
| Project map (this file) | `docs/` | **docs/MAP.md** |
| Backend entry, createEndpoint, errorHandler | `server/` | [server/BACKEND-HUB.md](../server/BACKEND-HUB.md) |
| Frontend: API, services, contents, logged | `app/` | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) |
| DB: connection, migrations, models | `server/database/` | [server/database/DATABASE.md](../server/database/DATABASE.md) |
| Domain features (one folder per domain) | `server/features/` | [server/features/FEATURES-INDEX.md](../server/features/FEATURES-INDEX.md) |
| Shared logged UI (modals, RichText, nav) | `app/logged/logged_components/` | [COMPONENTS-CONTRACTS.md](../app/logged/logged_components/COMPONENTS-CONTRACTS.md) |
| Requests hooks (static JSON, in-memory) | `app/logged/pages/requests/hooks/` | [REQUESTS-HOOKS-CONTRACT.md](../app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) |

---

## Si vas a cambiar X → abre Y

| Si tocas… | Abre primero | Luego si hace falta |
|-----------|--------------|----------------------|
| **Rutas API** (nuevo endpoint, auth, validación) | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) (contrato API) | [server/BACKEND-HUB.md](../server/BACKEND-HUB.md) (createEndpoint, roles) |
| **Auth / cookies / redirect** | Root `proxy.js`, `env.js` | [server/features/authentication](../server/features/authentication), [server/features/authorization](../server/features/authorization) |
| **Schema DB / migraciones** | [server/database/DATABASE.md](../server/database/DATABASE.md) | `server/database/migrations/*.sql` |
| **Lógica de negocio (CRUD, dominios)** | [server/features/FEATURES-INDEX.md](../server/features/FEATURES-INDEX.md) | Carpeta del feature (ej. `server/features/article/`) |
| **Errores que devuelve la API** | [server/errorHandler.js](../server/errorHandler.js) | Nueva clase en el feature + rama en errorHandler |
| **Servicios frontend (llamadas API)** | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) (Services) | `app/service/*.js`, `app/apiClient.js` |
| **Datos estáticos / tipos** | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) (Contents) | `app/contents/interfaces.ts`, `app/contents/*.json` |
| **Páginas logged / layout** | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) (Logged) | `app/logged/layout.tsx`, `app/logged/pages/` (árbol = rutas) |
| **UI compartida (modals, RichText, nav)** | [COMPONENTS-CONTRACTS.md](../app/logged/logged_components/COMPONENTS-CONTRACTS.md) | Archivo del componente |
| **Requests (quotations, company, other)** | [REQUESTS-HOOKS-CONTRACT.md](../app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) | Hooks + JSON en `app/contents/` |

---

## Contratos clave / invariantes globales

- **API:** Toda lógica vive en `server/`. `app/api/` solo recibe, valida (Joi), autentica (createEndpoint) y delega. No hay acceso directo a DB en rutas.
- **Auth:** Solo Cognito. Cookies id/access/refresh; login/logout en el browser (Amplify). Las rutas no emiten tokens; solo validan/refrescan.
- **DB:** Schema **solo** por migraciones SQL (orden por nombre). No `sync()` en producción. Tablas sin modelo → raw SQL en features.
- **Frontend:** Datos vivos → `app/service/*` → apiClient → `/api/*`. Estático → `app/contents/`. Requests (quotations, company, other) = JSON estático + estado en memoria, sin persistencia.
- **Idioma:** Variables, funciones, comentarios y cadenas de UI en **inglés**.

---

## Decisiones (links a secciones)

| Decisión | Dónde está |
|----------|-------------|
| Auth solo Cognito, cookies, sin API de login | [Global decisions](#global-decisions) abajo |
| API: createEndpoint, Joi, errorHandler | [server/BACKEND-HUB.md](../server/BACKEND-HUB.md) — contratos createEndpoint y errorHandler |
| Schema por migraciones, no sync | [server/database/DATABASE.md](../server/database/DATABASE.md) — Contract: migrations |
| Rutas y métodos alineados con client services | [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) — API contract, Services contract |
| Requests sin persistencia | [REQUESTS-HOOKS-CONTRACT.md](../app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) — Contract |

---

## Global decisions

- **Auth:** Cognito only. Cookies store id/access/refresh tokens; `proxy.js` (middleware) and `createEndpoint` validate/refresh. Login/logout via Amplify in browser; no API for sign-in.
- **API surface:** All `/api/v1/*` (except `/api/me`, `/api/validate-token`) use `createEndpoint`. Validation = Joi (query for GET, body for others). Errors go to `errorHandler` (known errors → status/message; unknown → 500 + requestId).
- **Database:** Postgres via Sequelize. Schema **only** via SQL migrations (filename order). No Sequelize `sync()` for production. Some tables exist only in migrations (e.g. `portals`, `users`, link tables); features use raw SQL or models where registered.
- **Frontend data:** Live data → `app/service/*` → apiClient → `/api/*`. Static/config → `app/contents/*.json` and `interfaces.ts`. Requests (quotations, company, other) are **static JSON + in-memory state** (no persistence).
- **Naming / language:** All variables, functions, comments, and user-facing strings in **English** (including docs). DoD: behaviour correct + English.

---

## Cómo probar / validar

- **App entera:** `npm run dev` → abrir http://localhost:3000, login, navegar a `/logged` y a páginas hijas. Comprobar que no hay 404 en rutas documentadas.
- **API:** Llamar a endpoints con curl/Postman (con cookies de sesión si son protegidos). Comprobar que errores conocidos devuelven el status esperado (ver [server/BACKEND-HUB.md](../server/BACKEND-HUB.md)).
- **Docs:** Tras cambiar arquitectura o contratos, actualizar MAP.md y el hub afectado; comprobar que los enlaces de este archivo llevan a las secciones correctas.

---

## Doc index (narrow tree)

| Doc | Role |
|-----|------|
| [AGENTS.md](../AGENTS.md) | Constitution: agent behaviour, doc index, when to read/update docs. |
| **docs/MAP.md** (this file) | Single map: architecture, routing, “si tocas X → Y”, global decisions. |
| [server/BACKEND-HUB.md](../server/BACKEND-HUB.md) | Backend: createEndpoint/errorHandler contract, DB entry, features routing. |
| [app/FRONTEND-HUB.md](../app/FRONTEND-HUB.md) | Frontend: API routes, services, contents, logged area routing. |
| [server/database/DATABASE.md](../server/database/DATABASE.md) | DB: migrations, no sync, models vs tables, gotchas. |
| [server/features/FEATURES-INDEX.md](../server/features/FEATURES-INDEX.md) | Features: ownership per domain, errors in errorHandler, gotchas. |
| [app/logged/logged_components/COMPONENTS-CONTRACTS.md](../app/logged/logged_components/COMPONENTS-CONTRACTS.md) | Shared components: props, invariants, gotchas. |
| [app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md](../app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) | Requests hooks: static JSON, in-memory, no persistence. |

No other folder-level docs. If a folder has no doc above, open the code; the tree is the map.
