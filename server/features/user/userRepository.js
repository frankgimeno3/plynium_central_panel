import Database from "../../database/database.js";

const ROLE_DESCRIPTIONS = {
  "only articles": "Acceso a la edición y creación de artículos",
  "articles and publications":
    "Acceso a la edición y creación de artículos y publicaciones",
  admin: "lo anterior más edición de roles",
};

const VALID_ROLES = ["only articles", "articles and publications", "admin"];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function mapRowToUser(row) {
  const role =
    row.user_role ?? row.role ?? "only articles";
  const validRole = VALID_ROLES.includes(role) ? role : "only articles";
  const fullName = row.user_full_name ?? row.name ?? ([row.user_name, row.user_surnames].filter(Boolean).join(" ") || "");
  const userListArray = Array.isArray(row.user_list_array) ? row.user_list_array : (row.userListArray ? (Array.isArray(row.userListArray) ? row.userListArray : []) : []);
  return {
    id: row.id ? String(row.id) : null,
    id_user: String(row.id_user ?? row.id ?? ""),
    user_full_name: fullName,
    user_name: row.user_name ?? row.email ?? row.username ?? "",
    user_role: validRole,
    user_description: row.user_description ?? ROLE_DESCRIPTIONS[validRole],
    enabled: row.enabled !== undefined ? Boolean(row.enabled) : true,
    userListArray,
  };
}

/**
 * Obtiene todos los usuarios desde la tabla `users` de RDS con sus listas (user_lists).
 * Incluye id (UUID), id_user y userListArray (list_code de cada lista). Requiere migración 036.
 */
export async function getUsersFromRds() {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const hasIdColumn = await sequelize.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id' LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  ).then((rows) => Array.isArray(rows) && rows.length > 0);
  let rows;
  if (hasIdColumn) {
    const [r] = await sequelize.query(`
      SELECT u.*,
        COALESCE(
          (SELECT array_agg(ul.list_code ORDER BY ul.list_code) FROM user_list_members ulm JOIN user_lists ul ON ul.id = ulm.list_id WHERE ulm.user_id = u.id),
          ARRAY[]::text[]
        ) AS user_list_array
      FROM users u
      ORDER BY u.id_user ASC
    `);
    rows = r;
  } else {
    const [r] = await sequelize.query("SELECT * FROM users ORDER BY id_user ASC");
    rows = r;
  }
  const list = Array.isArray(rows) ? rows : [];
  return list.map(mapRowToUser);
}

function mapRowToUserDetail(row) {
  const base = mapRowToUser(row);
  return {
    ...base,
    user_name: row.user_name ?? base.user_name ?? "",
    user_surnames: row.user_surnames ?? "",
    user_main_image_src: row.user_main_image_src ?? "",
    user_current_company: row.user_current_company ?? null,
    linkedin_profile: row.linkedin_profile ?? null,
    experience_array: row.experience_array ?? [],
    preferences: row.preferences ?? null,
  };
}

/**
 * Obtiene un usuario por id (UUID) o id_user (email) desde RDS con todos los campos.
 */
export async function getUserByIdFromRds(idOrIdUser) {
  if (!idOrIdUser) return null;
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const byId = UUID_REGEX.test(String(idOrIdUser).trim());
  const [rows] = await sequelize.query(
    byId
      ? "SELECT * FROM users WHERE id = :id LIMIT 1"
      : "SELECT * FROM users WHERE id_user = :id_user LIMIT 1",
    { replacements: byId ? { id: idOrIdUser } : { id_user: idOrIdUser } }
  );
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!row) return null;
  const detail = mapRowToUserDetail(row);
  const hasIdColumn = Object.prototype.hasOwnProperty.call(row, "id");
  if (hasIdColumn && row.id) detail.id = String(row.id);
  if (hasIdColumn && row.id) {
    const [listRows] = await sequelize.query(
      "SELECT ul.list_code FROM user_list_members ulm JOIN user_lists ul ON ul.id = ulm.list_id WHERE ulm.user_id = :user_id",
      { replacements: { user_id: row.id } }
    ).catch(() => [[]]);
    detail.userListArray = Array.isArray(listRows) ? listRows.map((r) => r.list_code) : [];
  } else {
    detail.userListArray = [];
  }
  return detail;
}

/**
 * Obtiene un usuario por id_user o user_name (email). Útil para Cognito username.
 */
export async function getUserByIdOrUsernameFromRds(idOrUsername) {
  if (!idOrUsername) return null;
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    return null;
  }
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    "SELECT * FROM users WHERE id_user = :val OR user_name = :val LIMIT 1",
    { replacements: { val: idOrUsername } }
  );
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return row ? mapRowToUser(row) : null;
}

/**
 * Obtiene todas las listas de usuarios (newsletter) desde RDS. Requiere migración 036.
 * Devuelve { id, list_code, name, portal, topic } (list_code = identificador estable, ej. list_editors).
 */
export async function getUserListsFromRds() {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  try {
    const [rows] = await sequelize.query(
      "SELECT id, list_code, name, portal, topic FROM user_lists ORDER BY list_code ASC"
    );
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => ({
      id: r.id,
      userList_id: r.list_code,
      userListName: r.name ?? "",
      userListPortal: r.portal ?? "plynium",
      userListTopic: r.topic ?? "",
    }));
  } catch {
    return [];
  }
}

/**
 * Obtiene un usuario por cognito_sub (UUID de Cognito).
 * Requiere que la columna cognito_sub exista y esté poblada (migración 018).
 */
export async function getUserByCognitoSubFromRds(cognitoSub) {
  if (!cognitoSub) return null;
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    return null;
  }
  const sequelize = db.getSequelize();
  try {
    const [rows] = await sequelize.query(
      "SELECT * FROM users WHERE cognito_sub = :val LIMIT 1",
      { replacements: { val: cognitoSub } }
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return row ? mapRowToUser(row) : null;
  } catch {
    return null;
  }
}
