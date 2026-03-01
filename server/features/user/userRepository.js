import Database from "../../database/database.js";

const ROLE_DESCRIPTIONS = {
  "only articles": "Acceso a la edición y creación de artículos",
  "articles and publications":
    "Acceso a la edición y creación de artículos y publicaciones",
  admin: "lo anterior más edición de roles",
};

const VALID_ROLES = ["only articles", "articles and publications", "admin"];

function mapRowToUser(row) {
  const role =
    row.user_role ?? row.role ?? "only articles";
  const validRole = VALID_ROLES.includes(role) ? role : "only articles";
  const fullName = row.user_full_name ?? row.name ?? ([row.user_name, row.user_surnames].filter(Boolean).join(" ") || "");
  return {
    id_user: String(row.id_user ?? row.id ?? ""),
    user_full_name: fullName,
    user_name: row.user_name ?? row.email ?? row.username ?? "",
    user_role: validRole,
    user_description: row.user_description ?? ROLE_DESCRIPTIONS[validRole],
    enabled: row.enabled !== undefined ? Boolean(row.enabled) : true,
  };
}

/**
 * Obtiene todos los usuarios desde la tabla `users` de RDS.
 * Compatible con columnas: id_user, user_full_name, user_name, user_role, user_description, enabled
 * o alternativas: id, name, email, role, enabled.
 */
export async function getUsersFromRds() {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    "SELECT * FROM users ORDER BY id_user ASC"
  );
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
    experience_array: row.experience_array ?? [],
    preferences: row.preferences ?? null,
  };
}

/**
 * Obtiene un usuario por id_user desde RDS con todos los campos.
 */
export async function getUserByIdFromRds(id_user) {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    "SELECT * FROM users WHERE id_user = :id_user LIMIT 1",
    { replacements: { id_user } }
  );
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return row ? mapRowToUserDetail(row) : null;
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
