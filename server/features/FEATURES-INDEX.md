# Features index (local — con dientes)

One folder per domain. Each owns its Model (if any), Service, enums, and custom errors. Use this to route and to avoid breaking invariants.

---

## Propósito y ownership

- **Propósito:** Centralizar el índice de dominios del backend (qué feature existe, qué archivos principales tiene, qué posee y qué no) y las reglas que evitan errores (errores en errorHandler, portal sin modelo, userRepository vs UserSerivce).
- **Este módulo (server/features/) posee:** Carpetas por dominio (authentication, authorization, user, event, article, content, publication, company, product, portal, banner, timeLog, modification). Cada feature posee su Model (si está en models.js), Service, enums y errores propios. **No posee:** rutas (app/api), cliente (app/service), conexión DB (server/database).
- **portal:** Solo posee PortalService y el contrato de la tabla `portals` (columnas). La tabla existe solo en migraciones; no hay modelo en models.js.

---

## Dónde está qué (rutas)

| Domain | Folder | Main files | Notes |
|--------|--------|------------|--------|
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

---

## Contrato (inputs/outputs/side effects)

Cada feature expone:

- **Services:** Métodos que reciben parámetros y devuelven datos o lanzan errores de dominio. Inputs/outputs dependen del dominio (ver tabla de routing). Side effect típico: leer/escribir DB o llamar a Cognito.
- **Repositories (solo user):** userRepository: `getUserByIdOrUsernameFromRds`, `getUserByCognitoSubFromRds` — solo lectura desde tabla `users`.
- **Errors:** Clases (ej. TimeLogNotFound) que deben estar mapeadas en `server/errorHandler.js` para obtener status HTTP correcto; si no, la API devuelve 500.

Los routes en `app/api/` son los únicos callers de estos servicios; no hay acceso directo a DB desde app/api.

---

## Flujo (estados y transiciones)

1. **Request:** app/api recibe la petición → createEndpoint valida y autentica → llama al callback del route.
2. **Callback del route:** Obtiene body/query validados y (si protected) request.email, request.sub, tokenPayload. Llama a uno o más servicios/repos de features.
3. **Service:** Usa modelos (getSequelize()) o raw SQL; puede lanzar errores de dominio (ej. TimeLogNotFound). Devuelve datos o lanza.
4. **Response:** El callback del route construye NextResponse.json(...). Si el service lanzó, errorHandler traduce a NextResponse con status/message.
5. **Errores no mapeados:** Cualquier error no importado en errorHandler → 500.

---

## Invariantes

- Un feature no llama a otro feature por regla general; si hay dependencia (ej. article usa content), está acotada y documentada en el código o aquí.
- /api/me usa solo userRepository (lectura); rutas admin/user usan UserSerivce (CRUD Cognito + RDS). No invertir estos roles.
- Cualquier error de dominio que se quiera exponer con un status HTTP concreto (404, 400, etc.) debe estar comprobado en errorHandler.
- portal no tiene modelo Sequelize; cualquier cambio de schema en `portals` implica migración + actualizar PortalService (raw SQL).

---

## Puntos peligrosos / gotchas

- **portal sin modelo:** Cambios en tabla `portals` → migración + actualizar queries en PortalService. No hay Model que “refleje” el schema.
- **userRepository vs UserSerivce:** Repository = lectura (getUserBy...). Service = crear/actualizar usuario (Cognito + RDS). /api/me usa repository; admin routes usan Service. No mezclar.
- **Associations:** Solo TimeLog–Modification está en associations.js. Otras relaciones (article–content, article–publication, etc.) son FK en modelo o tablas de enlace usadas por *PortalService o raw SQL.
- **Nuevo error de dominio:** Definir la clase en el feature, lanzarla desde el service, y **añadir un branch en server/errorHandler.js**. Si no, el cliente recibe 500.
- **Typo UserSerivce:** Está en el código; mantener o refactorizar en bloque (service + todos los imports).

---

## Cómo cambiarlo sin romper

- **Añadir un feature nuevo:** Crear carpeta bajo features/ con Model (si aplica), Service, y opcionalmente enums/errors. Si hay modelo, registrarlo en database/models.js (y associations.js si hay asociación). Si el feature lanza errores que deben ser 4xx/404, añadirlos en errorHandler.
- **Añadir un método a un service:** Mantener la misma convención de inputs/outputs y errores; si el método puede lanzar un error nuevo, mapearlo en errorHandler.
- **Cambiar schema de una tabla sin modelo:** Escribir migración; buscar todos los usos de esa tabla en features (raw SQL) y actualizar columnas/nombres en las queries.
- **Cambiar schema de un modelo:** Crear migración; actualizar la definición del modelo en el feature para que coincida con la migración (no al revés: la migración es la fuente de verdad).

---

## Tests relevantes y cómo ejecutarlos

No hay tests automatizados para features en el proyecto. Validar así:

- **Por feature:** Llamar desde la UI o con curl/Postman a la ruta API que usa ese feature. Comprobar respuesta 200/201 y que los datos devueltos son coherentes. Provocar el error de dominio (ej. id inexistente para TimeLogNotFound) y comprobar que la API devuelve el status esperado (404, 400, etc.) según errorHandler.
- **errorHandler:** Provocar un error no mapeado en cualquier route → debe devolver 500 con requestId; en dev, comprobar que el stack aparece.
- **portal:** GET /api/v1/portals debe devolver lista de portales; si cambiaste el SQL en PortalService, comprobar que las columnas devueltas coinciden con lo que consume el frontend.
