# Technical reference (contracts)

Single reference for all backend, frontend, database, features, components, and requests hooks. Use for contracts, invariants, and “how to change X without breaking”.

---

## Backend hub

Backend = `createEndpoint` + `errorHandler` + DB + features. API routes live in `app/api/` but **all logic** is here.

### Dónde está qué (rutas)

| Qué | Dónde |
|-----|--------|
| Factory de handlers API, auth, roles | `server/createEndpoint.js` |
| Mapeo error → HTTP | `server/errorHandler.js` |
| Conexión, modelos, asociaciones, migraciones | `server/database/` → [Database](#database) |
| Lógica por dominio (article, user, timeLog, etc.) | `server/features/` → [Features index](#features-index) |
| Inicio de DB al arrancar Node | Root `instrumentation-node.js` |

### Contratos clave / invariantes globales

- **Rutas en app/api:** Solo llaman a `createEndpoint` y a servicios/repos de `server/features/`. Cero acceso directo a DB.
- **createEndpoint:** Validación (Joi) → auth si isProtected → roles si roles.length > 0 → callback. Cualquier error lanzado → errorHandler.
- **errorHandler:** Solo los errores importados y comprobados aquí tienen status distinto de 500. Cualquier otro → 500 + requestId (y stack en dev).

### Contract: createEndpoint

**Signature:** `createEndpoint(callback, schema = null, isProtected = false, roles = [])`

- **callback(request, body):** Async. Receives `request` (plus `request.email`, `request.sub`, `request.tokenPayload` if protected) and validated `body`. Must return `NextResponse` (e.g. `NextResponse.json(...)`). Thrown errors go to `errorHandler`.
- **schema:** Joi. GET → validated from query params; POST/PUT/etc. → from JSON body or `multipart/form-data` (parsed to plain object). If validation fails → 400 with message.
- **isProtected:** If true, requires Cognito cookies; verifies id + access token; on failure refreshes with refresh token. Sets `request.email`, `request.sub`, `request.tokenPayload`. If no valid session → 400.
- **roles:** Array of strings (e.g. `['admin']`). After auth, `AuthorizationService.getUserRoles(username)`; if no role in list → 403. Fallback: if Cognito groups empty, uses `tokenPayload['custom:role']` or `tokenPayload.role`.

**Side effects:** On token refresh, response may set refreshed id/access cookies (same keys, `SESSION_COOKIE_MAX_AGE` cap).

**GOTCHA:** Validation error messages are currently in Spanish. Changing to English would require updating these strings and any client that parses them.

### Contract: errorHandler

**Signature:** `errorHandler(error)` → `NextResponse` (JSON).

- **Known errors (mapped):** `TimeLogNotFound` → 404; Cognito `InvalidPasswordException`, `InvalidParameterException`, `UsernameExistsException` → 400.
- **Unknown:** Logged; 500 with `message` (+ `requestId`; in dev also `error`, `details` with stack). DB connection errors get extra log context.

**Decision:** New domain errors (e.g. `ArticleNotFound`) must be defined in the feature and **added here** to get the right status. Otherwise they become 500.

**Ownership:** `errorHandler` owns the mapping. Features own the error classes.

### DB entry (backend)

- **Connection:** `Database.getInstance()`, `getSequelize()`, `connect()` — from [Database](#database). Loaded at Node startup via root `instrumentation-node.js`.
- **Models:** Registered in `database/models.js`; associations in `database/associations.js`. Tables only in migrations (e.g. `portals`, `users`, link tables) have **no** Sequelize model; features use raw SQL (e.g. `PortalService`).

### Features (domain logic)

One folder per domain under `server/features/`. Each typically: Model (if in `models.js`), Service, optional enums/errors. **Index and ownership:** [Features index](#features-index).

**Rule:** API routes in `app/api/` must **only** call server (createEndpoint + feature services/repositories). No direct DB in routes.

### Cómo probar / validar (backend)

- **Handlers protegidos:** Llamar sin cookies → 400; con cookies válidas → 200/201 según endpoint. Con rol incorrecto → 403.
- **Errores conocidos:** Provocar TimeLogNotFound → 404. Provocar error de Cognito → 400.
- **Errores desconocidos:** Provocar una excepción no mapeada en un handler → 500 con requestId; en dev, comprobar que el stack aparece en la respuesta.
- **DB:** Con env de DB vacío, la app puede arrancar (Sequelize null); con env correcto, las rutas que usan DB deben responder.

---

## Frontend hub

Single entry for the Next app: API routes, client services, static contents, and the logged UI.

### Dónde está qué (rutas)

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
| Componentes compartidos (modals, RichText, nav) | [Components contracts](#logged-components--contracts) |
| Hooks de requests (JSON + memoria) | [Requests hooks](#requests-hooks--contract) |

### Contratos clave / invariantes globales (frontend)

- **API:** Handlers en `route.js`; protegidos usan createEndpoint. Rutas y métodos deben coincidir con `app/service/*` para no desincronizar cliente/servidor.
- **Servicios:** Toda llamada a `/api/*` pasa por `apiClient.js` (credenciales, errores normalizados). Login/logout no usan API; usan Amplify/Cognito en el browser.
- **Contents:** Solo datos estáticos y tipos. Los datos vivos van por services → API.
- **Logged:** Layout único para todo `/logged` y `/logged/pages/*`; datos vivos vía services, estáticos vía contents; requests = JSON + estado en memoria (sin persistencia).

### API contract (app/api)

- **Handlers:** Live in `route.js` files. Protected routes use `server/createEndpoint.js` (Joi validation, Cognito auth, optional roles). Errors → `server/errorHandler.js`.
- **Outside /api/v1:**  
  - `GET /api/me` — Cookies only; returns `{ user_name }` (from RDS via userRepository by cognito_sub / id / username).  
  - `POST /api/validate-token` — Validates id + access token; 200 or 401.
- **Under /api/v1:** All use `createEndpoint`. Export `runtime = "nodejs"` when using DB. Main segments: admin/, articles, banners, companies, contents, events, portals, products, publications, time-log, etc. Exact paths and methods: see existing `app/api/v1/*/route.js`; keep in sync with Backend hub and with `app/service/*` when changing surface.

**Decision:** Route paths and methods must match client services in `app/service/`.

### Services contract (app/service)

- **apiClient.js (root app/):** Axios instance: `withCredentials: true`; response interceptor normalizes errors to `{ status, message, data }` and rethrows. All services use this; no direct `fetch` to `/api/*` from pages.
- **AuthenticationService.js:** Does **not** call the API for login/logout. Uses **AWS Amplify + Cognito** in the browser; stores session in cookies (CookieStorage). Env: `NEXT_PUBLIC_USER_POOL_*`.
- **Rest of app/service/*:** One module per domain (UserSerivce, ArticleService, ContentService, PublicationService, CompanyService, ProductService, PortalService, EventsService, BannerService). Methods map 1:1 to API routes (GET/POST/PUT/DELETE).

**GOTCHA:** Login/logout and token storage are Amplify/Cognito only. API routes only validate/refresh cookies; they don’t issue tokens.

### Contents contract (app/contents)

- **interfaces.ts:** TypeScript interfaces for domain entities (articleInterface, publicationInterface, Company, Product, etc.). Used for props and API payloads; naming may mix snake_case (API) and camelCase (UI).
- **JSON files:** Static datasets. Who uses what: planned_publications, pm_events, notifications, userContents, services, companyRequest, advertisementRequest, otherRequests, proposals, contracts, projects, customers, ga4 — each imported by specific pages or hooks. When adding/renaming a JSON file, update consumers and (if needed) interfaces.

**Ownership:** This folder owns static data and shared types. It does **not** own live data (that goes through services → API).

### Logged area (app/logged)

- **Layout:** `layout.tsx` wraps all `/logged` and `/logged/pages/*` with Topnav, Leftnav, and main content. Assumes user is logged in (enforced by root proxy).
- **Entry:** `page.tsx` at `/logged` = dashboard (user from `/api/me`, notifications from JSON, GA4 preview, links to requests/notifications/ga4).
- **Routes:** Everything under `app/logged/pages/` maps to URLs. One `page.tsx` per route segment. Contents/, directory/, management/, notifications/, requests/, users/, portals/, ga4/.

**Data rule:** Live data → `app/service/` + API. Static/config → `app/contents/` JSON and interfaces. Requests section: static JSON + in-memory hooks (see Requests hooks).

### Cómo probar / validar (frontend)

- **App:** `npm run dev` → login en `/`, navegar a `/logged` y a hijas. Comprobar que no hay 404 y que los datos se cargan (API o JSON según sección).
- **Login/logout:** Comprobar que login redirige a `/logged` y logout a `/`. Sin cookies válidas, acceso a `/logged` debe redirigir a `/` (proxy).

---

## Database

Contract and decisions for the DB layer.

### RDS schema (read-only reference)

- **Schema reference:** `docs/RDS_SCHEMA.md` (tables/columns/types/null/default for the `public` schema).

### Propósito y ownership

- **Propósito:** Exponer una única instancia de Sequelize (Postgres), registrar modelos y asociaciones, y definir **toda** la evolución del schema mediante migraciones SQL. Permitir arrancar sin DB en desarrollo (env incompleto).
- **Este módulo posee:** `database.js` (singleton), `models.js` (registro de modelos), `associations.js` (TimeLog–Modification), carpeta `migrations/`. **No posee:** lógica de negocio (está en `server/features/`).
- **Quién usa:** Root `instrumentation-node.js` (llama `database.connect()` al arrancar); features usan `Database.getInstance().getSequelize()` o raw SQL para tablas sin modelo.

### Contrato (inputs/outputs/side effects)

- **database.js**
  - **Inputs:** Env `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_HOST`, `DATABASE_PORT`. Opcional: certificado SSL en `certs/rds-ca.pem`.
  - **Outputs/API:** `getInstance()`, `getSequelize()`, `isConfigured()`, `connect()`, `sync()`. Si falta algún env requerido, sequelize es null.
  - **Side effects:** `connect()` abre la conexión; en producción no debe usarse `sync()` para schema.
- **models.js**
  - **Inputs:** Solo cuando `database.isConfigured()`. Importa definiciones de `../features/*` y usa `DataTypes`; llama `defineAssociations()`.
  - **Outputs:** Modelos registrados en la instancia (TimeLog, Modification, Article, Content, Publication, Event, Company, Product, Banner). Todos `underscored: true`.
  - **Side effects:** Inicializa los modelos en el singleton; define asociaciones (solo TimeLog–Modification en associations.js).
- **migrations/*.sql**
  - **Input:** Ejecución en orden lexicográfico de nombre de archivo.
  - **Output/Side effects:** CREATE/ALTER tablas, backfills. Deben ser idempotentes donde sea posible (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).

### Invariantes

- El schema en producción se modifica **solo** con migraciones SQL, nunca con `sync()`.
- El orden de ejecución de migraciones es el orden lexicográfico de los nombres de archivo.
- Cualquier tabla que exista solo en migraciones (sin modelo en models.js) se accede por raw SQL desde features; no se asume que exista un Model para ella.
- `defineAssociations()` se ejecuta una sola vez (guard interno en associations.js).

### Puntos peligrosos / gotchas (database)

- **Migrations no se ejecutan solas:** Si añades una migración, tu proceso de deploy o tú debes ejecutarla antes de que la app espere el nuevo schema.
- **Tablas sin modelo:** Cambiar el schema de `portals`, `users`, o tablas de enlace implica: (1) nueva migración, (2) actualizar el SQL en el feature que las usa (ej. PortalService, userRepository).
- **Añadir un modelo nuevo:** Crear el *Model.js en el feature, importarlo e inicializarlo en `models.js`; si tiene asociación con otro modelo, añadirla en `associations.js` y evitar doble ejecución de defineAssociations.

### Cómo cambiarlo sin romper (database)

- **Nueva migración:** Añadir `NNN_descripcion.sql` respetando la numeración; usar DDL idempotente; ejecutar en el mismo orden que el resto (por nombre). No borrar ni renombrar migraciones ya aplicadas en entornos compartidos.
- **Nuevo modelo:** Añadir el archivo del modelo en el feature, registrarlo en `models.js`; si aplica, añadir asociación en `associations.js`. No tocar tablas existentes solo en migraciones sin una migración que las altere.
- **Nueva tabla sin modelo:** Crear migración; en el feature usar solo raw SQL (o query builder) contra esa tabla. No añadirla a models.js si la decisión es mantenerla fuera del ORM.

---

## Features index

One folder per domain. Each owns its Model (if any), Service, enums, and custom errors.

### Propósito y ownership

- **Propósito:** Centralizar el índice de dominios del backend (qué feature existe, qué archivos principales tiene, qué posee y qué no) y las reglas que evitan errores (errores en errorHandler, portal sin modelo, userRepository vs UserSerivce).
- **Este módulo (server/features/) posee:** Carpetas por dominio (authentication, authorization, user, event, article, content, publication, company, product, portal, banner, timeLog, modification). Cada feature posee su Model (si está en models.js), Service, enums y errores propios. **No posee:** rutas (app/api), cliente (app/service), conexión DB (server/database).
- **portal:** Solo posee PortalService y el contrato de la tabla `portals` (columnas). La tabla existe solo en migraciones; no hay modelo en models.js.

### Dónde está qué (rutas) — features

| Domain | Folder | Main files | Notes |
|--------|--------|------------|-------|
| **authentication** | authentication/ | AuthenticationService.js | Verify/refresh Cognito tokens. Used by createEndpoint and root proxy.js. |
| **authorization** | authorization/ | AuthorizationService.js | getUserRoles(username). Used by createEndpoint for `roles`. |
| **user** | user/ | UserSerivce.js, userRepository.js | User CRUD (Cognito + RDS). userRepository for /api/me. |
| **event** | event/ | EventModel, EventService, EventPortalService | Events CRUD + event–portal. |
| **article** | article/ | ArticleModel, ArticleService, ArticlePublicationService | Articles CRUD + article–publication/portal, highlight. |
| **content** | content/ | ContentModel, ContentService | Content blocks (article_id, position, JSONB). |
| **publication** | publication/ | PublicationModel, PublicationService, PublicationPortalService | Publications CRUD + publication–portal. |
| **company** | company/ | CompanyModel, CompanyService, CompanyPortalService | Companies CRUD + company–portal. |
| **product** | product/ | ProductModel, ProductService, ProductPortalService | Products CRUD + product–portal. |
| **portal** | portal/ | PortalService.js | **No model.** Raw SQL on `portals` table. |
| **banner** | banner/ | BannerModel, BannerService | Banners CRUD. |
| **timeLog** | timeLog/ | TimeLogModel, TimeLogService, TimeLogTypeEnum, TimeLogError | TimeLogNotFound → mapped in errorHandler. |
| **modification** | modification/ | ModificationModel, ModificationService, ModificationStatusEnum, ModificationError | Linked to time logs; status, review. |

### Invariantes (features)

- Un feature no llama a otro feature por regla general; si hay dependencia (ej. article usa content), está acotada y documentada en el código o aquí.
- /api/me usa solo userRepository (lectura); rutas admin/user usan UserSerivce (CRUD Cognito + RDS). No invertir estos roles.
- Cualquier error de dominio que se quiera exponer con un status HTTP concreto (404, 400, etc.) debe estar comprobado en errorHandler.
- portal no tiene modelo Sequelize; cualquier cambio de schema en `portals` implica migración + actualizar PortalService (raw SQL).

### Puntos peligrosos / gotchas (features)

- **portal sin modelo:** Cambios en tabla `portals` → migración + actualizar queries en PortalService. No hay Model que “refleje” el schema.
- **userRepository vs UserSerivce:** Repository = lectura (getUserBy...). Service = crear/actualizar usuario (Cognito + RDS). /api/me usa repository; admin routes usan Service. No mezclar.
- **Associations:** Solo TimeLog–Modification está en associations.js. Otras relaciones (article–content, article–publication, etc.) son FK en modelo o tablas de enlace usadas por *PortalService o raw SQL.
- **Nuevo error de dominio:** Definir la clase en el feature, lanzarla desde el service, y **añadir un branch en server/errorHandler.js**. Si no, el cliente recibe 500.
- **Typo UserSerivce:** Está en el código; mantener o refactorizar en bloque (service + todos los imports).

### Cómo cambiarlo sin romper (features)

- **Añadir un feature nuevo:** Crear carpeta bajo features/ con Model (si aplica), Service, y opcionalmente enums/errors. Si hay modelo, registrarlo en database/models.js (y associations.js si hay asociación). Si el feature lanza errores que deben ser 4xx/404, añadirlos en errorHandler.
- **Añadir un método a un service:** Mantener la misma convención de inputs/outputs y errores; si el método puede lanzar un error nuevo, mapearlo en errorHandler.
- **Cambiar schema de una tabla sin modelo:** Escribir migración; buscar todos los usos de esa tabla en features (raw SQL) y actualizar columnas/nombres en las queries.
- **Cambiar schema de un modelo:** Crear migración; actualizar la definición del modelo en el feature para que coincida con la migración (la migración es la fuente de verdad).

---

## Logged components — contracts

Shared UI for the logged area. Use this when you **extend or integrate** a component.

### Propósito y ownership

- **Propósito:** Definir contratos (props, inputs/outputs, side effects), invariantes y gotchas de los componentes compartidos del área logged.
- **Este módulo posee:** Topnav, Leftnav, DatePicker, DateInputs, RichTextEditor (y subcomponentes), modals (EditUserModal, EditContentsModal, DeleteArticleModal, DeletePublicationModal, AddTagModal), iconos svg. **No posee:** componentes de página (article_components, banner_components, etc.), que viven junto a sus páginas.

### Contrato (inputs/outputs/side effects) — components

**RichTextEditor (RichTextEditor/, index)**

- **Inputs:** value (HTML string), onChange(html), placeholder, className, minHeight. RichTextContent: htmlOrPlain, className, as (div|p|span). isRichTextEmpty(html).
- **Outputs:** RichTextEditor emite cambios vía onChange(html). RichTextContent renderiza; isRichTextEmpty → boolean.
- **Side effects:** contentEditable; toolbar usa document.execCommand. RichTextContent usa dangerouslySetInnerHTML cuando el contenido parece HTML.

**Modals**

- **EditUserModal:** isOpen, initialUser (id_user, user_full_name, user_name, user_role, user_description), onSave(updatedUser), onCancel, saveError. Enter = save if changed; Escape = cancel.
- **EditContentsModal:** isOpen, initialValue, title, onSave(newValue), onCancel, isRichText. Muestra DateInputs, RichTextEditor o textarea según contexto. Enter save, Escape cancel.
- **DeleteArticleModal / DeletePublicationModal:** isOpen, articleTitle/publicationName, onConfirm, onCancel. Overlay o Escape = cancel.
- **AddTagModal:** isOpen, initialValue, onSave(newTag), onCancel. Un solo tag (string). Enter save si no vacío y cambiado.

Todos los modals son controlados: el padre posee open/close e initial values.

**DatePicker, DateInputs**

- **DatePicker:** value (string), onChange, className, placeholder, min, max. Emite ISO date string. Click outside cierra.
- **DateInputs:** parseDateFields(dateStr) → { day, month, year }; buildDateStr(day, month, year) → ISO o "". Componente: inputs día/mes/año; opcionales error, inputClassName.

**Topnav, Leftnav**

- **Topnav:** Título de app (link a /logged), Log out. Log out → AuthenticationService.logout() + router.replace('/').
- **Leftnav:** Secciones colapsables (Contents, Management, Requests, Plynium Network); links a cada página; estado activo desde usePathname(). Las secciones y links deben estar alineados con las rutas bajo `/logged/pages/`.

**SVG icons:** ChevronUpSvg, ChevronDownSvg, PencilSvg — presentacionales, prop size opcional.

### Invariantes (components)

- Los modals son siempre controlados: el padre decide isOpen y los valores iniciales. No usar con estado no controlado.
- RichTextEditor y RichTextContent esperan el mismo “shape” que se guarda: HTML o texto plano; el consumidor debe ser consistente.
- Leftnav debe incluir un link a cada ruta bajo `/logged/pages/` que se quiera accesible desde el menú; si añades una página nueva, añades el link aquí.
- DateInputs: parseDateFields y buildDateStr son la API pública para serialización; los inputs son solo UI para día/mes/año.

### Styling rules (logged UI)

- **Section titles (no card/background):** When a section header is rendered directly on the page background (no card, no panel), use `<h2 className="text-3xl font-semibold text-slate-100">…</h2>` for the title.
- **Tabs:** Tab strips in the logged area must visually match the event-state tabs in `ManagementDashboard` (same padding, rounded top corners, and active/inactive colors). Concretely, use a horizontal row with a bottom border, and per-tab classes equivalent to the existing implementation (active = blue background with white text and a bottom blue border; inactive = slate background with slate text and hover state).
- **Buttons:** Default primary buttons in the logged area (outside special modals) must reuse the same shape and colors as the “Add agenda event” button in `ManagementDashboard`: padding like `px-4 py-2`, background `bg-slate-600 hover:bg-slate-500`, text `text-slate-100`, `text-sm font-medium`, `rounded-xl`, and `cursor-pointer transition-colors`.
- **Tables:** Table headers must use uppercase labels (Tailwind `uppercase` on `<th>`), and follow the same visual pattern as the agenda table in `ManagementDashboard` (background, borders, and typography).
- **Language:** All visible UI text for these components (section titles, tab labels, button text, table headers, helper messages) must be written in **English**.

### Puntos peligrosos / gotchas (components)

- **RichText:** El contenido guardado puede ser HTML o texto plano. Quien use RichTextEditor/RichTextContent debe pasar el mismo formato que almacena. EditContentsModal usa RichTextEditor cuando isRichText; bloques de artículo/contenido lo usan para el cuerpo.
- **Modals:** Si el padre no actualiza initialValue/initialUser al abrir, el modal puede mostrar datos viejos. Sincronizar en useEffect cuando isOpen pasa a true.
- **Leftnav:** Añadir una ruta nueva en `app/logged/pages/` sin añadir link en Leftnav deja la página inaccesible desde el menú.
- **RichTextContent:** Usa dangerouslySetInnerHTML cuando detecta HTML; no inyectar HTML no sanitizado de fuentes no confiables.

### Cómo cambiarlo sin romper (components)

- **Añadir prop a un modal:** Añadir la prop al contrato aquí y al componente; asegurar que el padre pasa el valor y que el modal lo usa solo para lectura o para emitir por onSave. No romper la convención “controlled”.
- **Añadir una página bajo /logged/pages/:** Añadir el link correspondiente en Leftnav (misma sección o nueva) para que sea navegable.
- **Cambiar la forma de fecha en DateInputs:** Si cambias el formato de buildDateStr/parseDateFields, buscar todos los consumidores y actualizar la serialización/parsing.
- **RichTextEditor:** Si cambias el formato almacenado (HTML vs plain), actualizar isRichTextEmpty y todos los sitios que validan “vacío” o muestran con RichTextContent.

---

## Requests hooks — contract

Hooks that provide request data (company, advertisement, other) for the requests section. **Critical:** data is **static JSON + in-memory state only**; there is no persistence.

### Propósito y ownership

- **Propósito:** Exponer la lista y el detalle de “requests” (company, advertisement, other) para las páginas de la sección requests, con operaciones de actualización de estado y comentarios que **solo afectan al estado en memoria**.
- **Este módulo posee:** useCompanyRequests, useAdvertisements, useOtherRequests y los tipos/estados que exportan. **No posee:** los archivos JSON (viven en app/contents); solo los importa. Tampoco posee las páginas que consumen los hooks (solo las consumen).

### Contrato (inputs/outputs/side effects)

- **useCompanyRequests**
  - **Inputs:** Ninguno (opcional: Provider para compartir estado entre list y detail).
  - **Outputs:** requests (array), getById(id), updateState(id, newState). Tipos: RequestState, CompanyRequest, CompanyContent, etc.
  - **Side effects:** Carga companyRequest.json una vez (useEffect). updateState actualiza solo el estado React; no hay llamada a API.
- **useAdvertisements**
  - **Inputs:** Ninguno.
  - **Outputs:** list, currentTab, setCurrentTab, currentPage, setCurrentPage, paginatedAdvertisements, counts, totalPages, updateAdvertisementState(id, state), addComment(id, comment). Tipos: AdvertisementRequest, AdvertisementState, etc.
  - **Side effects:** Carga advertisementRequest.json una vez. updateAdvertisementState y addComment solo actualizan estado local.
- **useOtherRequests**
  - **Inputs:** Ninguno.
  - **Outputs:** requests, getById(id), updateState(id, newState).
  - **Side effects:** Carga otherRequests.json una vez. updateState solo estado local.

### Flujo (estados y transiciones)

1. **Montaje:** El hook hace fetch/import del JSON, lo normaliza al shape esperado y lo guarda en useState (requests/advertisements).
2. **Estado estable:** Lista disponible; getById/paginatedAdvertisements derivan de esa lista. currentTab/currentPage filtran o paginan en memoria.
3. **Transición “update state” o “add comment”:** El hook hace setState actualizando el item correspondiente (por id). No hay persistencia; al recargar la página o volver a entrar, se vuelve a cargar el JSON original.
4. **Navegación:** Si hay Provider (ej. company requests), list y detail comparten el mismo estado; si no, cada página puede tener su propia instancia del hook y el “cambio” no se ve en la otra hasta recargar.

### Invariantes (requests hooks)

- Los datos de requests **nunca** se persisten en backend en la implementación actual. Cualquier “cambio de estado” o “añadir comentario” es solo en memoria.
- El shape de los objetos (CompanyRequest, AdvertisementRequest, etc.) debe coincidir con el JSON en app/contents. Si cambias el JSON, debes actualizar el hook y los consumidores.
- Los hooks no llaman a app/service ni a /api; solo importan JSON estático.

### Puntos peligrosos / gotchas (requests hooks)

- **Sin persistencia:** Cualquier “state change” o “add comment” en la UI solo actualiza React state. Tras refresh o salir y volver a la sección, los cambios se pierden. No asumir que estos hooks hablan con una API.
- **Shape del JSON:** El comportamiento y los tipos dependen del shape de los JSON. Cambiar nombres o estructura en el JSON obliga a actualizar el hook y los componentes que consumen los tipos.
- **Ownership:** Los hooks poseen la “vista en memoria” de los datos de requests. Los archivos JSON son de app/contents; los hooks solo los importan. Si se renombra o mueve un JSON, actualizar el import en el hook.

### Cómo cambiarlo sin romper (requests hooks)

- **Añadir un tipo de request nuevo:** Añadir JSON en app/contents; crear un hook nuevo siguiendo el mismo patrón (useState + carga desde JSON, setter tipo updateState). Conectar el hub de requests y las páginas list/detail al nuevo hook. No asumir persistencia salvo que se añada API + service.
- **Añadir persistencia:** Implicaría nuevas rutas API, servicios en app/service, y que estos hooks llamen a la API en lugar de (o además de) cargar JSON. Hoy está fuera de alcance; documentar la decisión si se implementa.
- **Cambiar el shape del JSON:** Actualizar el hook (mapeo, tipos exportados) y todos los componentes que usen esos tipos (tablas, formularios de detalle). Si el JSON tiene nuevos campos opcionales, el hook puede ignorarlos hasta que la UI los use.
- **Cambiar nombres de archivo JSON:** Actualizar el import en el hook correspondiente (useCompanyRequests → companyRequest.json, etc.).

### Tests relevantes (requests hooks)

No hay tests automatizados para estos hooks. Validar así:

- **Carga inicial:** Entrar a /logged/pages/requests/quotations, .../company, .../other y comprobar que las listas se muestran sin error y que los datos coinciden con el contenido de advertisementRequest.json, companyRequest.json, otherRequests.json.
- **Update state / add comment:** En la UI, cambiar el estado de un request o añadir un comentario; comprobar que la lista o el detalle se actualizan en pantalla. Recargar la página y comprobar que los cambios **no** persisten (vuelve el estado del JSON).
- **Navegación list ↔ detail:** Abrir un request desde la lista, comprobar que el detalle muestra los mismos datos. Si hay Provider, cambiar estado en detalle y volver a la lista y comprobar que la lista refleja el cambio hasta que se recargue.
- **Cambio de JSON:** Si modificas un JSON, arrancar dev y comprobar que no hay errores de parsing y que la UI muestra los nuevos campos o valores.
