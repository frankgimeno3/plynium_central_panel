# Plynium Central Panel — Overview

Next.js app with Cognito auth and a Postgres backend.

**Run:** `npm run dev` → [http://localhost:3000](http://localhost:3000).

All project documentation lives in **docs/**: this file (OVERVIEW) and [REFERENCE.md](REFERENCE.md) (technical contracts).

---

## Getting started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `app/page.tsx` for the home (login) page.

- **Project layout and architecture:** sections below and [REFERENCE.md](REFERENCE.md).

---

## Project map (hub)

Single entry for “where do I look?” and “why is it like this?”. Optimized for **routing** (1–2 jumps) and **semantic density** (rules, not descriptions).

### What this doc contains

- **Architecture by domains:** Next app, API layer, auth/session, backend, DB, client data, logged area — and what each owns.
- **Route table:** Where each concern lives (paths and doc links).
- **Si vas a cambiar X → abre Y:** Table that sends you to the right doc or code.
- **Global decisions:** Auth, API, DB, frontend data, naming — with links to sections below.
- **Doc index:** The narrow tree (now 2 files: OVERVIEW + REFERENCE).

---

## Dónde está qué (rutas)

| Area | Path | In REFERENCE.md |
|------|------|------------------|
| Constitution, agent behaviour | This file | — |
| Project map | This file | — |
| Backend: createEndpoint, errorHandler, features | `server/` | [Backend hub](REFERENCE.md#backend-hub) |
| Frontend: API, services, contents, logged | `app/` | [Frontend hub](REFERENCE.md#frontend-hub) |
| DB: connection, migrations, models | `server/database/` | [Database](REFERENCE.md#database) |
| Domain features (one folder per domain) | `server/features/` | [Features index](REFERENCE.md#features-index) |
| Shared logged UI (modals, RichText, nav) | `app/logged/logged_components/` | [Components contracts](REFERENCE.md#logged-components--contracts) |
| Requests hooks (static JSON, in-memory) | `app/logged/pages/network/requests/` | [Requests hooks contract](REFERENCE.md#requests-hooks--contract) |

---

## Si vas a cambiar X → abre Y

| Si tocas… | Abre primero | Luego si hace falta |
|-----------|--------------|----------------------|
| **Rutas API** (nuevo endpoint, auth, validación) | [REFERENCE: Frontend hub](REFERENCE.md#api-contract-appapi) | [REFERENCE: Backend hub](REFERENCE.md#contract-createendpoint) |
| **Auth / cookies / redirect** | Root `proxy.js`, `env.js` | `server/features/authentication`, `server/features/authorization` |
| **Schema DB / migraciones** | [REFERENCE: Database](REFERENCE.md#database) | `server/database/migrations/*.sql` |
| **Lógica de negocio (CRUD, dominios)** | [REFERENCE: Features index](REFERENCE.md#features-index) | Carpeta del feature (ej. `server/features/article/`) |
| **Errores que devuelve la API** | `server/errorHandler.js` | Nueva clase en el feature + rama en errorHandler |
| **Servicios frontend (llamadas API)** | [REFERENCE: Frontend hub – Services](REFERENCE.md#services-contract-appservice) | `app/service/*.js`, `app/apiClient.js` |
| **Datos estáticos / tipos** | [REFERENCE: Frontend hub – Contents](REFERENCE.md#contents-contract-appcontents) | `app/contents/interfaces.ts`, `app/contents/*.json` |
| **Páginas logged / layout** | [REFERENCE: Frontend hub – Logged](REFERENCE.md#logged-area-applogged) | `app/logged/layout.tsx`, `app/logged/pages/` |
| **UI compartida (modals, RichText, nav)** | [REFERENCE: Components contracts](REFERENCE.md#logged-components--contracts) | Archivo del componente |
| **Requests (quotations, company, other)** | [REFERENCE: Requests hooks](REFERENCE.md#requests-hooks--contract) | Hooks + JSON en `app/contents/` |

---

## Contratos clave / invariantes globales

- **API:** Toda lógica vive en `server/`. `app/api/` solo recibe, valida (Joi), autentica (createEndpoint) y delega. No hay acceso directo a DB en rutas.
- **Auth:** Solo Cognito. Cookies id/access/refresh; login/logout en el browser (Amplify). Las rutas no emiten tokens; solo validan/refrescan.
- **DB:** Schema **solo** por migraciones SQL (orden por nombre). No `sync()` en producción. Tablas sin modelo → raw SQL en features.
- **Frontend:** Datos vivos → `app/service/*` → apiClient → `/api/*`. Estático → `app/contents/`. Requests (quotations, company, other) = JSON estático + estado en memoria, sin persistencia.
- **Idioma:** Variables, funciones, comentarios y cadenas de UI en **inglés**.

---

## Global decisions

- **Auth:** Cognito only. Cookies store id/access/refresh tokens; `proxy.js` (middleware) and `createEndpoint` validate/refresh. Login/logout via Amplify in browser; no API for sign-in.
- **API surface:** All `/api/v1/*` (except `/api/me`, `/api/validate-token`) use `createEndpoint`. Validation = Joi (query for GET, body for others). Errors go to `errorHandler` (known errors → status/message; unknown → 500 + requestId).
- **Database:** Postgres via Sequelize. Schema **only** via SQL migrations (filename order). No Sequelize `sync()` for production. Some tables exist only in migrations (e.g. `portals`, `users`, link tables); features use raw SQL or models where registered.
- **Frontend data:** Live data → `app/service/*` → apiClient → `/api/*`. Static/config → `app/contents/*.json` and `interfaces.ts`. Requests (quotations, company, other) are **static JSON + in-memory state** (no persistence).
- **Naming / language:** All variables, functions, comments, and user-facing strings in **English** (including docs). DoD: behaviour correct + English.

---

## Agent behaviour (documentation)

1. **Use the doc structure.** Only two maintained docs: **docs/OVERVIEW.md** (this file) and **docs/REFERENCE.md**. Do not search the repo for random READMEs; only these are the source of truth.
2. **When the user refers to a folder:** Use “Si vas a cambiar X → abre Y” above and the corresponding section in REFERENCE.md. If the folder has no section, open the code.
3. **After changing behaviour or contracts:** Update the corresponding section in REFERENCE.md when the change affects contracts, decisions, or gotchas.
4. **Naming and language:** All code and docs in **English**. Definition of Done: behaviour correct and English preserved.

---

## Design principle (for humans and agents)

- **Árbol estrecho, no árbol profundo.** Two strong docs: OVERVIEW (map, decisions, agent rules) and REFERENCE (all technical contracts). Optimize for **routing** (1–2 jumps) and **semantic density** (rules, not descriptions).

---

## Cómo probar / validar

- **App entera:** `npm run dev` → abrir http://localhost:3000, login, navegar a `/logged` y a páginas hijas. Comprobar que no hay 404 en rutas documentadas.
- **API:** Llamar a endpoints con curl/Postman (con cookies de sesión si son protegidos). Comprobar que errores conocidos devuelven el status esperado (ver REFERENCE: Backend hub).
- **Docs:** Tras cambiar arquitectura o contratos, actualizar OVERVIEW o REFERENCE y comprobar que los enlaces llevan a las secciones correctas.

---

## Doc index (narrow tree)

| Doc | Role |
|-----|------|
| **docs/OVERVIEW.md** (this file) | Map, getting started, agent behaviour, global decisions, “si tocas X → Y”. |
| [docs/REFERENCE.md](REFERENCE.md) | All technical contracts: Backend, Frontend, Database, Features, Components, Requests hooks. |

No other folder-level docs. If a folder has no section in REFERENCE, open the code; the tree is the map.

---

## Root and app root (no dedicated doc)

- **Root:** `env.js` (COGNITO), `proxy.js` (auth/session), `instrumentation-node.js` (DB connect), `next.config.ts`, `tsconfig.json`, `package.json`, etc. See sections above for architecture.
- **app/ root:** `apiClient.js`, `layout.tsx`, `page.tsx` (login), `not-found.tsx`. See REFERENCE: Frontend hub.
