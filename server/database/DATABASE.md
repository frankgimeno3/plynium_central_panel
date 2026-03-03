# Database (local — con dientes)

Contract and decisions for the DB layer. Prefer this over opening code when you touch schema, connection, or models.

---

## Propósito y ownership

- **Propósito:** Exponer una única instancia de Sequelize (Postgres), registrar modelos y asociaciones, y definir **toda** la evolución del schema mediante migraciones SQL. Permitir arrancar sin DB en desarrollo (env incompleto).
- **Este módulo posee:** `database.js` (singleton), `models.js` (registro de modelos), `associations.js` (TimeLog–Modification), carpeta `migrations/`. **No posee:** lógica de negocio (está en `server/features/`).
- **Quién usa:** Root `instrumentation-node.js` (llama `database.connect()` al arrancar); features usan `Database.getInstance().getSequelize()` o raw SQL para tablas sin modelo.

---

## Contrato (inputs/outputs/side effects)

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

---

## Flujo (estados y transiciones)

1. **Arranque:** `instrumentation-node.js` importa `database/database.js` y `database/models.js`, luego llama `database.connect()`. Si connect falla: en dev se loguea warning; en producción exit(1).
2. **Estado:** Conexión abierta (o null si no configurado). Modelos y asociaciones ya registrados. Migraciones **no** se ejecutan automáticamente por la app; deben correrse por deploy/CI o a mano.
3. **Uso:** Los features obtienen Sequelize con `Database.getInstance().getSequelize()` para modelos; para tablas solo en migraciones usan `getSequelize().query(...)` o equivalente.

---

## Invariantes

- El schema en producción se modifica **solo** con migraciones SQL, nunca con `sync()`.
- El orden de ejecución de migraciones es el orden lexicográfico de los nombres de archivo.
- Cualquier tabla que exista solo en migraciones (sin modelo en models.js) se accede por raw SQL desde features; no se asume que exista un Model para ella.
- `defineAssociations()` se ejecuta una sola vez (guard interno en associations.js).

---

## Puntos peligrosos / gotchas

- **Migrations no se ejecutan solas:** Si añades una migración, tu proceso de deploy o tú debes ejecutarla antes de que la app espere el nuevo schema. Si no, fallan queries o inits.
- **Tablas sin modelo:** Cambiar el schema de `portals`, `users`, o tablas de enlace implica: (1) nueva migración, (2) actualizar el SQL en el feature que las usa (ej. PortalService, userRepository).
- **Añadir un modelo nuevo:** Crear el *Model.js en el feature, importarlo e inicializarlo en `models.js`; si tiene asociación con otro modelo, añadirla en `associations.js` y evitar doble ejecución de defineAssociations.

---

## Cómo cambiarlo sin romper

- **Nueva migración:** Añadir `NNN_descripcion.sql` respetando la numeración; usar DDL idempotente; ejecutar en el mismo orden que el resto (por nombre). No borrar ni renombrar migraciones ya aplicadas en entornos compartidos.
- **Nuevo modelo:** Añadir el archivo del modelo en el feature, registrarlo en `models.js`; si aplica, añadir asociación en `associations.js`. No tocar tablas existentes solo en migraciones sin una migración que las altere.
- **Nueva tabla sin modelo:** Crear migración; en el feature usar solo raw SQL (o query builder) contra esa tabla. No añadirla a models.js si la decisión es mantenerla fuera del ORM.

---

## Tests relevantes y cómo ejecutarlos

No hay tests automatizados para este módulo en el proyecto. Validar así:

- **Conexión:** Con env de DB correcto, `npm run dev` y que ninguna ruta que use DB falle por conexión. Con env de DB vacío/incompleto, la app debe arrancar (y las rutas que usan DB fallarán al usarse).
- **Migraciones:** Ejecutar las migraciones en un entorno de prueba en orden; comprobar que no hay errores y que el schema resultante coincide con lo que usan los features (columnas, FKs). Si añades una migración, ejecutarla y hacer una petición que use la tabla/columna nueva.
- **Modelos:** Tras cambiar models.js o associations.js, arrancar la app y abrir una ruta que use ese modelo (ej. listar artículos, time logs) para comprobar que no hay error de init o de query.
