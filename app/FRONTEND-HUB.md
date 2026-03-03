# Frontend hub

Single entry for the Next app: API routes, client services, static contents, and the logged UI. Use for routing; open code only when changing implementation.

---

## Qué contiene

- **Routing (1–2 jumps):** Tabla “necesitas X → abre Y” dentro del frontend.
- **Contratos:** API (handlers, /api/me, /api/validate-token, /api/v1/*), Services (apiClient, AuthenticationService, resto por dominio), Contents (interfaces, JSON), Logged (layout, rutas por carpeta).
- **Decisiones y gotchas:** Enlaces a secciones y trampas conocidas.

---

## Dónde está qué (rutas)

| Qué | Dónde |
|-----|--------|
| Handlers API | `app/api/` — `route.js` por segmento (v1/admin, v1/articles, …) |
| Cliente HTTP (axios, credenciales, normalización de errores) | `app/apiClient.js` |
| Servicios por dominio (Article, User, Portal, …) | `app/service/*.js` |
| Login/logout (Amplify/Cognito, sin API) | `app/service/AuthenticationService.js` |
| Tipos e interfaces compartidos | `app/contents/interfaces.ts` |
| JSON estáticos | `app/contents/*.json` |
| Layout y dashboard logged | `app/logged/layout.tsx`, `app/logged/page.tsx` |
| Rutas de páginas logged | `app/logged/pages/` (árbol = URL) |
| Componentes compartidos (modals, RichText, nav) | [app/logged/logged_components/COMPONENTS-CONTRACTS.md](logged/logged_components/COMPONENTS-CONTRACTS.md) |
| Hooks de requests (JSON + memoria) | [app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md](logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) |

---

## Si vas a cambiar X → abre Y

| Si cambias… | Abre primero | Luego si hace falta |
|-------------|--------------|----------------------|
| Una ruta API o su método/auth | [API contract](#api-contract-appapi) + `app/api/v1/.../route.js` | [server/BACKEND-HUB.md](../server/BACKEND-HUB.md) (createEndpoint) |
| Un método de servicio que llama a la API | [Services contract](#services-contract-appservice) + `app/service/*.js` | `app/apiClient.js` |
| Tipos o datos estáticos | [Contents contract](#contents-contract-appcontents) + `app/contents/` | Consumidores (páginas, hooks) |
| Layout logged o una página | [Logged area](#logged-area-applogged) + `app/logged/layout.tsx` o `app/logged/pages/...` | COMPONENTS-CONTRACTS si usas modals/nav |
| Requests (quotations, company, other) | [REQUESTS-HOOKS-CONTRACT.md](logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) | Hooks + JSON en `app/contents/` |

---

## Contratos clave / invariantes globales

- **API:** Handlers en `route.js`; protegidos usan createEndpoint. Rutas y métodos deben coincidir con `app/service/*` para no desincronizar cliente/servidor.
- **Servicios:** Toda llamada a `/api/*` pasa por `apiClient.js` (credenciales, errores normalizados). Login/logout no usan API; usan Amplify/Cognito en el browser.
- **Contents:** Solo datos estáticos y tipos. Los datos vivos van por services → API.
- **Logged:** Layout único para todo `/logged` y `/logged/pages/*`; datos vivos vía services, estáticos vía contents; requests = JSON + estado en memoria (sin persistencia).

---

## Decisiones (links a secciones)

| Decisión | Dónde |
|----------|--------|
| Rutas y métodos alineados con client services | [API contract](#api-contract-appapi), [Services contract](#services-contract-appservice) |
| No hay API de login; Amplify/Cognito en browser | [Services contract](#services-contract-appservice) |
| Requests sin persistencia | [REQUESTS-HOOKS-CONTRACT.md](logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) |

---

## API contract (app/api)

- **Handlers:** Live in `route.js` files. Protected routes use `server/createEndpoint.js` (Joi validation, Cognito auth, optional roles). Errors → `server/errorHandler.js`.
- **Outside /api/v1:**  
  - `GET /api/me` — Cookies only; returns `{ user_name }` (from RDS via userRepository by cognito_sub / id / username).  
  - `POST /api/validate-token` — Validates id + access token; 200 or 401.
- **Under /api/v1:** All use `createEndpoint`. Export `runtime = "nodejs"` when using DB. Main segments:  
  **admin/** (user, time-logs, modifications), **articles**, **banners**, **companies**, **contents**, **events**, **portals**, **products**, **publications**, **time-log**.  
  Exact paths and methods: see existing `app/api/v1/*/route.js`; keep in sync with [server/BACKEND-HUB.md](../server/BACKEND-HUB.md) and with `app/service/*` when changing surface.

**Decision:** Route paths and methods must match client services in `app/service/`. When you add or change an endpoint, update the corresponding service and this mental map.

---

## Services contract (app/service)

- **apiClient.js (root app/):** Axios instance: `withCredentials: true`; response interceptor normalizes errors to `{ status, message, data }` and rethrows. All services use this; no direct `fetch` to `/api/*` from pages.
- **AuthenticationService.js:** Does **not** call the API for login/logout. Uses **AWS Amplify + Cognito** in the browser; stores session in cookies (CookieStorage). Used by `app/page.tsx`. Env: `NEXT_PUBLIC_USER_POOL_*`.
- **Rest of app/service/*:** One module per domain (UserSerivce, ArticleService, ContentService, PublicationService, CompanyService, ProductService, PortalService, EventsService, BannerService). Methods map 1:1 to API routes (GET/POST/PUT/DELETE). Session/me: dashboard may call `fetch('/api/me')` directly (no dedicated service wrapper in codebase).

**GOTCHA:** Login/logout and token storage are Amplify/Cognito only. API routes only validate/refresh cookies; they don’t issue tokens. Don’t add a “login API route” that duplicates Cognito.

---

## Contents contract (app/contents)

- **interfaces.ts:** TypeScript interfaces for domain entities (articleInterface, publicationInterface, Company, Product, etc.). Used for props and API payloads; naming may mix snake_case (API) and camelCase (UI).
- **JSON files:** Static datasets. Who uses what: planned_publications, planned_newsletters, pm_events, notifications, userContents, services, companyRequest, advertisementRequest, otherRequests, proposals, contracts, projects, customers, ga4 — each imported by specific pages or hooks. When adding/renaming a JSON file, update consumers and (if needed) interfaces.

**Ownership:** This folder owns static data and shared types. It does **not** own live data (that goes through services → API).

---

## Logged area (app/logged)

- **Layout:** `layout.tsx` wraps all `/logged` and `/logged/pages/*` with Topnav, Leftnav, and main content. Assumes user is logged in (enforced by root proxy).
- **Entry:** `page.tsx` at `/logged` = dashboard (user from `/api/me`, notifications from JSON, GA4 preview, links to requests/notifications/ga4).
- **Routes:** Everything under `app/logged/pages/` maps to URLs. One `page.tsx` per route segment. No need for a doc per page folder — the tree is the map:
  - **contents/** — articles, publications, banners, events, services (each with list/create/detail as in folder structure).
  - **directory/** — companies, products (list, create, detail).
  - **management/** — hub, publications_management, newsletter_management, sm (proposals, projects, contracts, customers_db).
  - **notifications**, **requests** (hub + quotations, company, requests), **users**, **portals**, **ga4**.

**Data rule:** Live data → `app/service/` + API. Static/config → `app/contents/` JSON and interfaces. Requests section: static JSON + in-memory hooks (see REQUESTS-HOOKS-CONTRACT).

---

## Cómo probar / validar

- **App:** `npm run dev` → login en `/`, navegar a `/logged` y a hijas (contents, directory, requests, users, etc.). Comprobar que no hay 404 y que los datos se cargan (API o JSON según sección).
- **API desde cliente:** Usar la UI que llama a cada servicio (listas, formularios, detalle). Si añades un endpoint nuevo, añadir la llamada en el service y probar desde la pantalla que lo use.
- **Login/logout:** Comprobar que login redirige a `/logged` y logout a `/`. Sin cookies válidas, acceso a `/logged` debe redirigir a `/` (proxy).
- **Docs:** Tras cambiar rutas o contratos de API/services/contents, actualizar este hub y comprobar enlaces a COMPONENTS-CONTRACTS y REQUESTS-HOOKS-CONTRACT.
