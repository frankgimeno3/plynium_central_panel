# Agent context and documentation (constitution — hub)

Use this file to understand how documentation is organized and how the agent should behave. **Always** prefer the doc index below; the tree is narrow — few hubs, local docs only where there is contract, decision, or danger.

---

## Qué contiene

- **Documentation index:** Lista única de todos los MD mantenidos (hubs y locales “con dientes”), con rol de cada uno.
- **Root and app root:** Dónde está la config raíz y el entry del app (sin doc dedicado; se apunta a MAP y FRONTEND-HUB).
- **Agent behaviour:** Reglas de uso del índice, cuándo leer qué doc, cuándo actualizar docs, y requisito de inglés.
- **Design principle:** Árbol estrecho, densidad semántica, “solo prescribe”.

---

## Dónde está qué (rutas)

| Qué | Dónde |
|-----|--------|
| Mapa del proyecto, arquitectura, “si tocas X → Y” | [docs/MAP.md](docs/MAP.md) |
| Backend: createEndpoint, errorHandler, features | [server/BACKEND-HUB.md](server/BACKEND-HUB.md) |
| Frontend: API, services, contents, logged | [app/FRONTEND-HUB.md](app/FRONTEND-HUB.md) |
| DB, migraciones, modelos | [server/database/DATABASE.md](server/database/DATABASE.md) |
| Features por dominio | [server/features/FEATURES-INDEX.md](server/features/FEATURES-INDEX.md) |
| Componentes compartidos logged | [app/logged/logged_components/COMPONENTS-CONTRACTS.md](app/logged/logged_components/COMPONENTS-CONTRACTS.md) |
| Hooks de requests | [app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md](app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) |

---

## Si vas a cambiar X → abre Y

Para **código o decisiones de arquitectura**, usa la tabla “[Si vas a cambiar X → abre Y](docs/MAP.md#si-vas-a-cambiar-x--abre-y)” en [docs/MAP.md](docs/MAP.md).  
Para **cambiar qué docs existen o cómo se organizan**, este archivo (AGENTS.md) y el [Doc index](docs/MAP.md#doc-index-narrow-tree) en MAP.md son la fuente de verdad.

---

## Contratos clave / invariantes

- Solo existen los docs listados en el [Documentation index](#documentation-index-narrow-tree). No crear README por carpeta “porque sí”.
- Después de cambiar comportamiento o contratos, actualizar el hub o doc local correspondiente (BACKEND-HUB, FRONTEND-HUB, DATABASE, FEATURES-INDEX, COMPONENTS-CONTRACTS, REQUESTS-HOOKS-CONTRACT) cuando afecte a contrato, decisión o gotcha.
- Todo el código y docs: variables, funciones, comentarios y cadenas de UI en **inglés**. DoD: comportamiento correcto + inglés.

---

## Decisiones (links a secciones)

| Decisión | Dónde |
|----------|--------|
| Índice de docs es la única entrada; no buscar README aleatorios | [Agent behaviour](#agent-behaviour) |
| Solo añadir docs que prescriban (contrato, decisión, gotcha, guía de cambio, ownership) | [Design principle](#design-principle-for-humans-and-agents) |
| Qué doc actualizar tras un cambio | [Agent behaviour](#agent-behaviour) punto 3 |

---

## Cómo probar / validar

- **Que la documentación sigue siendo coherente:** Tras editar un MD, comprobar que los enlaces de AGENTS.md y de [docs/MAP.md](docs/MAP.md) llevan a archivos y secciones existentes. Revisar que el índice no menciona docs eliminados.
- **Que el agente tiene una ruta clara:** Para una tarea tipo “cambiar X”, seguir “si tocas X → abre Y” desde MAP y comprobar que en 1–2 saltos se llega al código o al doc con el contrato.

---

## Documentation index (narrow tree)

| Doc | Role |
|-----|------|
| **AGENTS.md** (this file) | Constitution: agent behaviour, doc index, when to read/update docs. |
| [docs/MAP.md](docs/MAP.md) | Single map: architecture by domains, “si tocas X → Y”, global decisions. |
| [server/BACKEND-HUB.md](server/BACKEND-HUB.md) | Backend: createEndpoint/errorHandler contract, DB entry, features routing. |
| [app/FRONTEND-HUB.md](app/FRONTEND-HUB.md) | Frontend: API routes, services, contents, logged area routing. |
| [server/database/DATABASE.md](server/database/DATABASE.md) | DB: migrations, no sync, models vs tables, gotchas. |
| [server/features/FEATURES-INDEX.md](server/features/FEATURES-INDEX.md) | Features: ownership per domain, errors in errorHandler, gotchas. |
| [app/logged/logged_components/COMPONENTS-CONTRACTS.md](app/logged/logged_components/COMPONENTS-CONTRACTS.md) | Shared components: props, invariants, gotchas. |
| [app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md](app/logged/pages/requests/hooks/REQUESTS-HOOKS-CONTRACT.md) | Requests hooks: static JSON, in-memory, no persistence. |

No other folder-level docs. If a folder has no doc in this list, **open the code**; the tree is the map.

---

## Root and app root (no dedicated doc)

- **Root:** `env.js` (COGNITO), `proxy.js` (auth/session), `instrumentation-node.js` (DB connect), `next.config.ts`, `tsconfig.json`, `package.json`, etc. See [docs/MAP.md](docs/MAP.md) for architecture.
- **app/ root:** `apiClient.js`, `layout.tsx`, `page.tsx` (login), `not-found.tsx`. See [app/FRONTEND-HUB.md](app/FRONTEND-HUB.md).

---

## Agent behaviour

1. **Use this index for structure.** Prefer the paths above. Do not search the repo for random READMEs; many have been removed. Only the docs listed here are maintained as “hubs” or “con dientes”.
2. **When the user refers to a folder:** Determine the area (server, app, logged, etc.). If [docs/MAP.md](docs/MAP.md) or a hub says “si tocas X → abre Y”, read that doc first. If the folder has no doc in the index, open the code.
3. **After changing behaviour or contracts:** Update the corresponding doc (BACKEND-HUB, FRONTEND-HUB, DATABASE, FEATURES-INDEX, COMPONENTS-CONTRACTS, REQUESTS-HOOKS-CONTRACT) when the change affects contracts, decisions, or gotchas. Do not add new READMEs for “what’s in this folder”; only add docs that **prescribe** (contract, decision, guía de cambio, gotcha, ownership).
4. **Naming and language:** All variables, functions, comments, and user-facing strings in the codebase and in these docs are in **English**. Definition of Done for any task: behaviour correct and English preserved.

---

## Design principle (for humans and agents)

- **Árbol estrecho, no árbol profundo.** Few strong docs at the top (MAP, BACKEND-HUB, FRONTEND-HUB) and a small set of local docs only where there is real “teeth”: contract, decision, gotcha, guía de cambio, ownership. If a doc would only “describe” (e.g. “in this folder are the components”), it does not justify its existence — the tree already shows that. Optimize for **routing** (1–2 jumps) and **semantic density** (rules, not descriptions).
