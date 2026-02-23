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
  return {
    id_user: String(row.id_user ?? row.id ?? ""),
    user_full_name: row.user_full_name ?? row.name ?? "",
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
