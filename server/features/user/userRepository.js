import Database from "../../database/database.js";

const ROLE_DESCRIPTIONS = {
  "only articles": "Acceso a la edición y creación de artículos",
  "articles and publications":
    "Acceso a la edición y creación de artículos y publicaciones",
  admin: "lo anterior más edición de roles",
};

const VALID_ROLES = ["only articles", "articles and publications", "admin"];

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function schemaUsesUsersDb(sequelize) {
  const rows = await sequelize.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'user_id' LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  return Array.isArray(rows) && rows.length > 0;
}

function mapRowToUser(row) {
  const role =
    row.user_role ?? row.role ?? "only articles";
  const validRole = VALID_ROLES.includes(role) ? role : "only articles";
  const fullName = row.user_full_name ?? row.name ?? ([row.user_name, row.user_surnames].filter(Boolean).join(" ") || "");
  const fromDbArray = row.newsletter_user_lists_id_array;
  let userListArray = [];
  if (Array.isArray(fromDbArray) && fromDbArray.length > 0) {
    userListArray = fromDbArray.map((x) => String(x));
  } else if (Array.isArray(row.user_list_array)) {
    userListArray = row.user_list_array.map((x) => String(x));
  } else if (row.userListArray && Array.isArray(row.userListArray)) {
    userListArray = row.userListArray.map((x) => String(x));
  }
  const uid = row.user_id ?? row.id;
  const email = row.user_email ?? row.id_user ?? "";
  return {
    id: uid ? String(uid) : null,
    id_user: String(email || (uid ? String(uid) : "")),
    user_full_name: fullName,
    user_name: row.user_name ?? row.email ?? row.username ?? "",
    user_role: validRole,
    user_description: row.user_description ?? ROLE_DESCRIPTIONS[validRole],
    enabled: row.enabled !== undefined ? Boolean(row.enabled) : true,
    userListArray,
  };
}

/**
 * Obtiene todos los usuarios desde la tabla `users_db` de RDS con sus listas (newsletter_user_lists).
 * Incluye user_id (UUID), id_user (email en API) y userListArray desde users_db.newsletter_user_lists_id_array.
 */
export async function getUsersFromRds() {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const hasUserIdColumn = await schemaUsesUsersDb(sequelize);
  let rows;
  if (hasUserIdColumn) {
    const [r] = await sequelize.query("SELECT * FROM users_db u ORDER BY u.user_email ASC");
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
    contact_id_array: Array.isArray(row.contact_id_array) ? row.contact_id_array.map((x) => String(x)) : [],
    user_employee_relations_array: Array.isArray(row.user_employee_relations_array)
      ? row.user_employee_relations_array
      : (Array.isArray(row.employee_relations_array) ? row.employee_relations_array : []),
    linkedin_profile: row.user_linkedin_profile ?? row.linkedin_profile ?? null,
    preferences: row.user_preferences ?? row.preferences ?? null,
  };
}

export async function setUserContactIdsInRds(idOrEmail, contactIds = []) {
  const user = await getUserByIdFromRds(idOrEmail);
  if (!user?.id) {
    throw new Error("User not found");
  }

  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const ids = Array.isArray(contactIds) ? contactIds.map((x) => String(x)).filter(Boolean) : [];

  // Ensure column exists (migration 115)
  const hasColumn = await sequelize.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'contact_id_array' LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  if (!Array.isArray(hasColumn) || hasColumn.length === 0) {
    throw new Error("users_db.contact_id_array does not exist (run migration 115_users_db_contact_id_array.sql)");
  }

  await sequelize.query(
    "UPDATE public.users_db SET contact_id_array = :arr::text[] WHERE user_id = :id",
    { replacements: { arr: ids, id: String(user.id) } }
  );

  return await getUserByIdFromRds(String(user.id));
}

export async function setUserLinkedinProfileInRds(idOrEmail, linkedinProfile) {
  const user = await getUserByIdFromRds(idOrEmail);
  if (!user?.id) throw new Error("User not found");

  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  // Ensure column exists
  const hasColumn = await sequelize.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'user_linkedin_profile' LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  if (!Array.isArray(hasColumn) || hasColumn.length === 0) {
    throw new Error("users_db.user_linkedin_profile does not exist");
  }

  const val = typeof linkedinProfile === "string" ? linkedinProfile.trim() : "";
  await sequelize.query(
    "UPDATE public.users_db SET user_linkedin_profile = :val WHERE user_id = :id",
    { replacements: { val: val || null, id: String(user.id) } }
  );

  return await getUserByIdFromRds(String(user.id));
}

export async function setUserNewsletterListsInRds(idOrEmail, listIds = []) {
  const user = await getUserByIdFromRds(idOrEmail);
  if (!user?.id) throw new Error("User not found");

  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const hasColumn = await sequelize.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = 'newsletter_user_lists_id_array' LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  if (!Array.isArray(hasColumn) || hasColumn.length === 0) {
    throw new Error("users_db.newsletter_user_lists_id_array does not exist (run migration 085_users_db_newsletter_user_lists_id_array.sql)");
  }

  const ids = Array.isArray(listIds) ? listIds.map((x) => String(x)).filter(Boolean) : [];
  await sequelize.query(
    "UPDATE public.users_db SET newsletter_user_lists_id_array = :arr::uuid[] WHERE user_id = :id",
    { replacements: { arr: ids, id: String(user.id) } }
  );

  return await getUserByIdFromRds(String(user.id));
}

/**
 * Obtiene un usuario por user_id (UUID) o user_email (antes id_user) desde RDS con todos los campos.
 */
export async function getUserByIdFromRds(idOrIdUser) {
  if (!idOrIdUser) return null;
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const byId = UUID_REGEX.test(String(idOrIdUser).trim());
  const newSchema = await schemaUsesUsersDb(sequelize);
  const [rows] = await sequelize.query(
    newSchema
      ? (byId
        ? "SELECT * FROM users_db WHERE user_id = :id LIMIT 1"
        : "SELECT * FROM users_db WHERE user_email = :user_email LIMIT 1")
      : (byId
        ? "SELECT * FROM users WHERE id = :id LIMIT 1"
        : "SELECT * FROM users WHERE id_user = :id_user LIMIT 1"),
    {
      replacements: newSchema
        ? (byId ? { id: idOrIdUser } : { user_email: idOrIdUser })
        : (byId ? { id: idOrIdUser } : { id_user: idOrIdUser }),
    }
  );
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!row) return null;
  const detail = mapRowToUserDetail(row);
  const uid = row.user_id ?? row.id;
  if (uid) detail.id = String(uid);
  return detail;
}

/**
 * Obtiene un usuario por user_email (antes id_user) o user_name (email). Útil para Cognito username.
 */
export async function getUserByIdOrUsernameFromRds(idOrUsername) {
  if (!idOrUsername) return null;
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    return null;
  }
  const sequelize = db.getSequelize();
  const newSchema = await schemaUsesUsersDb(sequelize);
  const [rows] = await sequelize.query(
    newSchema
      ? "SELECT * FROM users_db WHERE user_email = :val OR user_name = :val LIMIT 1"
      : "SELECT * FROM users WHERE id_user = :val OR user_name = :val LIMIT 1",
    { replacements: { val: idOrUsername } }
  );
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return row ? mapRowToUser(row) : null;
}

/**
 * Obtiene todas las listas de usuarios (newsletter) desde RDS (tabla newsletter_user_lists).
 * userList_id es el UUID de la lista (texto); userListPortal resume los portal_name_key del array de portales.
 */
export async function getUserListsFromRds() {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  try {
    const [rows] = await sequelize.query(
      `SELECT
        nul.newsletter_user_list_id,
        nul.newsletter_user_list_name,
        nul.newsletter_user_list_topic,
        nul.newsletter_user_list_description,
        nul.newsletter_user_list_portals_array_id,
        (
          SELECT string_agg(p.portal_name_key, ', ' ORDER BY u.ord)
          FROM unnest(nul.newsletter_user_list_portals_array_id) WITH ORDINALITY AS u(pid, ord)
          JOIN portals_db p ON p.portal_id = u.pid
        ) AS portal_label
       FROM newsletter_user_lists nul
       ORDER BY nul.newsletter_user_list_name ASC NULLS LAST, nul.newsletter_user_list_id`
    );
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => ({
      id: r.newsletter_user_list_id,
      userList_id: String(r.newsletter_user_list_id),
      userListName: r.newsletter_user_list_name ?? "",
      userListPortal: r.portal_label ?? "",
      userListTopic: r.newsletter_user_list_topic ?? "",
      userListDescription: r.newsletter_user_list_description ?? "",
    }));
  } catch {
    return [];
  }
}

/**
 * Obtiene un usuario por user_cognito_sub (UUID de Cognito).
 * Requiere que la columna exista y esté poblada (migración 020 + 048).
 */
export async function getUserByCognitoSubFromRds(cognitoSub) {
  if (!cognitoSub) return null;
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    return null;
  }
  const sequelize = db.getSequelize();
  try {
    const newSchema = await schemaUsesUsersDb(sequelize);
    const [rows] = await sequelize.query(
      newSchema
        ? "SELECT * FROM users_db WHERE user_cognito_sub = :val LIMIT 1"
        : "SELECT * FROM users WHERE cognito_sub = :val LIMIT 1",
      { replacements: { val: cognitoSub } }
    );
    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    return row ? mapRowToUser(row) : null;
  } catch {
    return null;
  }
}
