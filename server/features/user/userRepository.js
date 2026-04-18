import Database from "../../database/database.js";

const ROLE_DESCRIPTIONS = {
  "only articles": "Access to creating and editing articles",
  "articles and publications":
    "Access to creating and editing articles and publications",
  admin: "All of the above plus role management",
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

async function userListSubscriptionsTableExists(sequelize) {
  const rows = await sequelize.query(
    "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_list_subscriptions' LIMIT 1",
    { type: sequelize.QueryTypes.SELECT }
  );
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * List IDs where this user has a row in user_list_subscriptions.
 */
async function getNewsletterListIdsContainingUserFromRds(sequelize, userId) {
  if (!userId) return [];
  try {
    const [rows] = await sequelize.query(
      `SELECT newsletter_user_list_id
       FROM public.user_list_subscriptions
       WHERE user_id = :uid::uuid`,
      { replacements: { uid: String(userId) } }
    );
    const list = Array.isArray(rows) ? rows : [];
    return list.map((r) => String(r.newsletter_user_list_id));
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("user_list_subscriptions") || msg.includes("does not exist")) {
      return [];
    }
    throw e;
  }
}

function mergeUserListIds(fromUserColumn, fromListRows) {
  const set = new Set();
  for (const x of fromUserColumn || []) set.add(String(x));
  for (const x of fromListRows || []) set.add(String(x));
  return Array.from(set);
}

/** SQL `ARRAY['…'::uuid,…]::uuid[]` — Sequelize `:param::uuid[]` bindings are unreliable for uuid[]. */
function sqlUuidArrayExpr(validatedIds) {
  if (!Array.isArray(validatedIds) || validatedIds.length === 0) {
    return "ARRAY[]::uuid[]";
  }
  return `ARRAY[${validatedIds.map((id) => `'${String(id)}'::uuid`).join(",")}]::uuid[]`;
}

function mapRowToUser(row) {
  const role =
    row.user_role ?? row.role ?? "only articles";
  const validRole = VALID_ROLES.includes(role) ? role : "only articles";
  const fullName = row.user_full_name ?? row.name ?? ([row.user_name, row.user_surnames].filter(Boolean).join(" ") || "");
  let userListArray = [];
  if (Array.isArray(row.user_list_array) && row.user_list_array.length > 0) {
    userListArray = row.user_list_array.map((x) => String(x));
  } else if (Array.isArray(row.newsletter_user_lists_id_array) && row.newsletter_user_lists_id_array.length > 0) {
    userListArray = row.newsletter_user_lists_id_array.map((x) => String(x));
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
 * Loads all users from `users_db` on RDS with newsletter list IDs in userListArray
 * (aggregated from user_list_subscriptions when that table exists).
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
    const subsTable = await userListSubscriptionsTableExists(sequelize);
    const [r] = subsTable
      ? await sequelize.query(
          `SELECT u.*, subs.ids AS user_list_array
           FROM users_db u
           LEFT JOIN LATERAL (
             SELECT COALESCE(array_agg(s.newsletter_user_list_id ORDER BY s.newsletter_user_list_id), '{}'::uuid[]) AS ids
             FROM public.user_list_subscriptions s
             WHERE s.user_id = u.user_id
           ) subs ON true
           ORDER BY u.user_email ASC`
        )
      : await sequelize.query("SELECT * FROM users_db u ORDER BY u.user_email ASC");
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

async function usersDbColumnExists(sequelize, columnName) {
  const rows = await sequelize.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users_db' AND column_name = :col LIMIT 1`,
    { replacements: { col: String(columnName) }, type: sequelize.QueryTypes.SELECT }
  );
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Updates users_db profile fields (name, surnames, description, role when column exists).
 * Does not change user_email / user_id.
 */
export async function updateUserProfileFieldsInRds(idOrEmail, fields = {}) {
  const user = await getUserByIdFromRds(idOrEmail);
  if (!user?.id) {
    throw new Error("User not found");
  }

  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();

  const user_name = fields.user_name != null ? String(fields.user_name) : "";
  const user_surnames = fields.user_surnames != null ? String(fields.user_surnames) : "";
  const user_description = fields.user_description != null ? String(fields.user_description) : "";

  const rawRole = fields.user_role != null ? String(fields.user_role) : "only articles";
  const user_role = VALID_ROLES.includes(rawRole) ? rawRole : "only articles";

  const hasUserRoleCol = await usersDbColumnExists(sequelize, "user_role");
  const id = String(user.id);

  if (hasUserRoleCol) {
    await sequelize.query(
      `UPDATE public.users_db
       SET user_name = :user_name,
           user_surnames = :user_surnames,
           user_description = :user_description,
           user_role = :user_role
       WHERE user_id = :id::uuid`,
      { replacements: { user_name, user_surnames, user_description, user_role, id } }
    );
  } else {
    await sequelize.query(
      `UPDATE public.users_db
       SET user_name = :user_name,
           user_surnames = :user_surnames,
           user_description = :user_description
       WHERE user_id = :id::uuid`,
      { replacements: { user_name, user_surnames, user_description, id } }
    );
  }

  return getUserByIdFromRds(String(user.id));
}

export async function setUserNewsletterListsInRds(idOrEmail, listIds = []) {
  const user = await getUserByIdFromRds(idOrEmail);
  if (!user?.id) throw new Error("User not found");

  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const ids = Array.isArray(listIds)
    ? [...new Set(listIds.map((x) => String(x).trim()).filter((id) => UUID_REGEX.test(id)))]
    : [];

  const uid = String(user.id);
  if (!UUID_REGEX.test(uid)) {
    throw new Error("Invalid user id");
  }

  const hasSubTable = await userListSubscriptionsTableExists(sequelize);
  if (!hasSubTable) {
    throw new Error("user_list_subscriptions does not exist (run migration 080_user_list_subscriptions.sql)");
  }

  await sequelize.query(`DELETE FROM public.user_list_subscriptions WHERE user_id = :uid::uuid`, {
    replacements: { uid },
  });
  for (const lid of ids) {
    await sequelize.query(
      `INSERT INTO public.user_list_subscriptions (user_id, newsletter_user_list_id) VALUES (:uid::uuid, :lid::uuid)`,
      { replacements: { uid, lid } }
    );
  }

  return await getUserByIdFromRds(String(user.id));
}

/**
 * Loads one user by user_id (UUID) or user_email (legacy id_user) from RDS with full detail fields.
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
  const subsTable = newSchema && (await userListSubscriptionsTableExists(sequelize));
  const userSql =
    newSchema && subsTable
      ? `SELECT u.*, subs.ids AS user_list_array
         FROM users_db u
         LEFT JOIN LATERAL (
           SELECT COALESCE(array_agg(s.newsletter_user_list_id ORDER BY s.newsletter_user_list_id), '{}'::uuid[]) AS ids
           FROM public.user_list_subscriptions s
           WHERE s.user_id = u.user_id
         ) subs ON true
         WHERE ${byId ? "u.user_id = :id" : "u.user_email = :user_email"} LIMIT 1`
      : newSchema
        ? (byId
          ? "SELECT * FROM users_db WHERE user_id = :id LIMIT 1"
          : "SELECT * FROM users_db WHERE user_email = :user_email LIMIT 1")
        : (byId
          ? "SELECT * FROM users WHERE id = :id LIMIT 1"
          : "SELECT * FROM users WHERE id_user = :id_user LIMIT 1");
  const [rows] = await sequelize.query(userSql, {
    replacements: newSchema
      ? (byId ? { id: idOrIdUser } : { user_email: idOrIdUser })
      : (byId ? { id: idOrIdUser } : { id_user: idOrIdUser }),
  });
  const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  if (!row) return null;
  const detail = mapRowToUserDetail(row);
  const uid = row.user_id ?? row.id;
  if (uid) detail.id = String(uid);
  if (newSchema && detail.id && !subsTable) {
    const fromLists = await getNewsletterListIdsContainingUserFromRds(sequelize, detail.id);
    detail.userListArray = mergeUserListIds(detail.userListArray, fromLists);
  }
  return detail;
}

/**
 * Loads a user by user_email (legacy id_user) or user_name (email). Useful when matching Cognito username.
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
  if (!row) return null;
  const mapped = mapRowToUser(row);
  const uid = row.user_id ?? row.id;
  if (newSchema && uid) {
    const subsTable = await userListSubscriptionsTableExists(sequelize);
    if (subsTable) {
      const fromLists = await getNewsletterListIdsContainingUserFromRds(sequelize, String(uid));
      mapped.userListArray = mergeUserListIds(mapped.userListArray, fromLists);
    }
  }
  return mapped;
}

async function newsletterUserListsColumnExists(sequelize, columnName) {
  const rows = await sequelize.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'newsletter_user_lists' AND column_name = :col LIMIT 1`,
    { replacements: { col: String(columnName) }, type: sequelize.QueryTypes.SELECT }
  );
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Loads newsletter lists from RDS (newsletter_user_lists + user_list_portal → portals_db).
 * @param {{ portalId?: number | null }} [opts] - When set, only lists with that user_list_portal.
 * API field userListPortal is a short summary (user count). portalId is the portal FK (migration 078).
 */
export async function getUserListsFromRds(opts = {}) {
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const hasNewsletterListTypeCol = await newsletterUserListsColumnExists(
    sequelize,
    "newsletter_list_type"
  );
  const rawPid = opts?.portalId;
  const portalId =
    rawPid != null && rawPid !== "" && Number.isFinite(Number(rawPid)) ? Number(rawPid) : null;

  const wherePortal =
    portalId != null && Number.isInteger(portalId) ? "WHERE nul.user_list_portal = :portalId" : "";

  const listTypeResolvedSql = hasNewsletterListTypeCol
    ? `COALESCE(nul.newsletter_list_type, camp.newsletter_type) AS newsletter_list_type_resolved`
    : `camp.newsletter_type AS newsletter_list_type_resolved`;

  const listTypeNoCampaignSql = hasNewsletterListTypeCol
    ? `COALESCE(nul.newsletter_list_type, 'specific'::character varying) AS newsletter_list_type_resolved`
    : `'specific'::character varying AS newsletter_list_type_resolved`;

  const listMemberIdsSql = `COALESCE(
    (SELECT array_agg(s.user_id ORDER BY s.user_id)
     FROM public.user_list_subscriptions s
     WHERE s.newsletter_user_list_id = nul.newsletter_user_list_id),
    '{}'::uuid[]
  )`;

  const lateralCampaignType = `
LEFT JOIN LATERAL (
  SELECT c.newsletter_type
  FROM public.newsletter_campaigns c
  WHERE c.newsletter_user_lists_id_array @> ARRAY[nul.newsletter_user_list_id]::uuid[]
  ORDER BY c.newsletter_campaign_id ASC
  LIMIT 1
) camp ON true`;

  const mapListRow = (r) => {
    const ids = Array.isArray(r.list_user_ids_array)
      ? r.list_user_ids_array.map((x) => String(x))
      : [];
    const n = ids.length;
    const pid = r.user_list_portal;
    const rawType =
      r.newsletter_list_type_resolved ?? r.newsletter_list_type ?? r.newsletter_type;
    const newsletterListType =
      rawType === "main" || rawType === "specific" ? rawType : "specific";
    return {
      id: r.newsletter_user_list_id,
      userList_id: String(r.newsletter_user_list_id),
      userListName: r.newsletter_user_list_name ?? "",
      userListPortal: n === 0 ? "—" : `${n} user${n === 1 ? "" : "s"}`,
      portalId: pid != null && Number.isFinite(Number(pid)) ? Number(pid) : null,
      portalKey: r.portal_name_key != null ? String(r.portal_name_key) : "",
      userListTopic: r.newsletter_user_list_topic ?? "",
      userListDescription: r.newsletter_user_list_description ?? "",
      listUserIdsArray: ids,
      newsletterListType,
    };
  };

  try {
    const [rows] = await sequelize.query(
      `SELECT
        nul.newsletter_user_list_id,
        nul.newsletter_user_list_name,
        nul.newsletter_user_list_topic,
        nul.newsletter_user_list_description,
        ${listMemberIdsSql} AS list_user_ids_array,
        nul.user_list_portal,
        p.portal_name_key AS portal_name_key,
        ${listTypeResolvedSql}
       FROM public.newsletter_user_lists nul
       LEFT JOIN public.portals_db p ON p.portal_id = nul.user_list_portal
       ${lateralCampaignType}
       ${wherePortal}
       ORDER BY nul.newsletter_user_list_name ASC NULLS LAST, nul.newsletter_user_list_id`,
      portalId != null && Number.isInteger(portalId) ? { replacements: { portalId } } : {}
    );
    const list = Array.isArray(rows) ? rows : [];
    return list.map(mapListRow);
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("user_list_portal") && msg.includes("does not exist")) {
      try {
        const [rowsLegacy] = await sequelize.query(
          `SELECT
            nul.newsletter_user_list_id,
            nul.newsletter_user_list_name,
            nul.newsletter_user_list_topic,
            nul.newsletter_user_list_description,
            ${listMemberIdsSql} AS list_user_ids_array,
            ${listTypeResolvedSql}
           FROM public.newsletter_user_lists nul
           ${lateralCampaignType}
           ORDER BY nul.newsletter_user_list_name ASC NULLS LAST, nul.newsletter_user_list_id`
        );
        const list = Array.isArray(rowsLegacy) ? rowsLegacy : [];
        return list.map((r) => mapListRow({ ...r, user_list_portal: null, portal_name_key: null }));
      } catch {
        const [rowsLegacy2] = await sequelize.query(
          `SELECT
            nul.newsletter_user_list_id,
            nul.newsletter_user_list_name,
            nul.newsletter_user_list_topic,
            nul.newsletter_user_list_description,
            ${listMemberIdsSql} AS list_user_ids_array,
            ${listTypeNoCampaignSql}
           FROM public.newsletter_user_lists nul
           ORDER BY nul.newsletter_user_list_name ASC NULLS LAST, nul.newsletter_user_list_id`
        );
        const list = Array.isArray(rowsLegacy2) ? rowsLegacy2 : [];
        return list.map((r) =>
          mapListRow({
            ...r,
            user_list_portal: null,
            portal_name_key: null,
          })
        );
      }
    }
    try {
      const [rowsFallback] = await sequelize.query(
        `SELECT
          nul.newsletter_user_list_id,
          nul.newsletter_user_list_name,
          nul.newsletter_user_list_topic,
          nul.newsletter_user_list_description,
          ${listMemberIdsSql} AS list_user_ids_array,
          nul.user_list_portal,
          p.portal_name_key AS portal_name_key,
          ${listTypeNoCampaignSql}
         FROM public.newsletter_user_lists nul
         LEFT JOIN public.portals_db p ON p.portal_id = nul.user_list_portal
         ${wherePortal}
         ORDER BY nul.newsletter_user_list_name ASC NULLS LAST, nul.newsletter_user_list_id`,
        portalId != null && Number.isInteger(portalId) ? { replacements: { portalId } } : {}
      );
      const list = Array.isArray(rowsFallback) ? rowsFallback : [];
      return list.map((r) => mapListRow({ ...r }));
    } catch {
      return [];
    }
  }
}

/**
 * Inserts (user_id, newsletter_user_list_id) pairs into user_list_subscriptions.
 */
async function bulkAddUsersToNewsletterListsInTx(sequelize, transaction, userIds, listIds) {
  const uids = [
    ...new Set(
      (userIds || []).map((x) => String(x).trim()).filter((id) => UUID_REGEX.test(id))
    ),
  ];
  const lids = [
    ...new Set(
      (listIds || []).map((x) => String(x).trim()).filter((id) => UUID_REGEX.test(id))
    ),
  ];
  if (uids.length === 0 || lids.length === 0) return;

  const uSql = sqlUuidArrayExpr(uids);
  const lSql = sqlUuidArrayExpr(lids);

  await sequelize.query(
    `INSERT INTO public.user_list_subscriptions (user_id, newsletter_user_list_id)
     SELECT u.uid::uuid, l.lid::uuid
     FROM (SELECT unnest(${uSql}) AS uid) u
     CROSS JOIN (SELECT unnest(${lSql}) AS lid) l
     ON CONFLICT (user_id, newsletter_user_list_id) DO NOTHING`,
    { transaction }
  );
}

/**
 * Creates one newsletter_user_lists row per portal entry and optionally assigns users to every new list.
 * @param {{ name: string, description?: string, portals: { portalId: number, listType: 'main'|'specific' }[], userIds?: string[] }} payload
 */
export async function createNewsletterUserListsInRds(payload) {
  const name = String(payload?.name ?? "").trim();
  const description = payload?.description != null ? String(payload.description) : "";
  const portalsIn = Array.isArray(payload?.portals) ? payload.portals : [];
  const userIdsIn = Array.isArray(payload?.userIds) ? payload.userIds : [];

  if (!name) {
    throw new Error("List name is required");
  }

  const byPortal = new Map();
  for (const p of portalsIn) {
    const pid = Number(p?.portalId);
    const lt = p?.listType === "main" ? "main" : "specific";
    if (Number.isInteger(pid) && pid >= 0) {
      byPortal.set(pid, lt);
    }
  }
  const portalEntries = [...byPortal.entries()];
  if (portalEntries.length === 0) {
    throw new Error("Select at least one portal");
  }

  const userIds = [
    ...new Set(
      userIdsIn.map((x) => String(x).trim()).filter((id) => UUID_REGEX.test(id))
    ),
  ];

  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();

  const hasPortal = await newsletterUserListsColumnExists(sequelize, "user_list_portal");
  if (!hasPortal) {
    throw new Error("user_list_portal column missing on newsletter_user_lists (run migration 078)");
  }
  const hasListType = await newsletterUserListsColumnExists(sequelize, "newsletter_list_type");

  const createdListIds = [];

  await sequelize.transaction(async (t) => {
    for (const [portalId, listType] of portalEntries) {
      let sql;
      let replacements;
      if (hasListType) {
        sql = `INSERT INTO public.newsletter_user_lists (
          newsletter_user_list_name,
          newsletter_user_list_description,
          user_list_portal,
          newsletter_list_type
        ) VALUES (:name, :description, :portalId, :listType)
        RETURNING newsletter_user_list_id`;
        replacements = {
          name,
          description: description || "",
          portalId,
          listType,
        };
      } else {
        sql = `INSERT INTO public.newsletter_user_lists (
          newsletter_user_list_name,
          newsletter_user_list_description,
          user_list_portal
        ) VALUES (:name, :description, :portalId)
        RETURNING newsletter_user_list_id`;
        replacements = { name, description: description || "", portalId };
      }
      const [ins] = await sequelize.query(sql, { replacements, transaction: t });
      const row = Array.isArray(ins) && ins.length > 0 ? ins[0] : null;
      const newId = row?.newsletter_user_list_id;
      if (!newId) {
        throw new Error("Failed to create newsletter list");
      }
      createdListIds.push(String(newId));
    }

    await bulkAddUsersToNewsletterListsInTx(sequelize, t, userIds, createdListIds);
  });

  return { listIds: createdListIds };
}

/**
 * Loads a user by user_cognito_sub (Cognito UUID).
 * Requires the column to exist and be populated (migrations 020 + 048).
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
    if (!row) return null;
    const mapped = mapRowToUser(row);
    const uid = row.user_id ?? row.id;
    if (newSchema && uid) {
      const subsTable = await userListSubscriptionsTableExists(sequelize);
      if (subsTable) {
        const fromLists = await getNewsletterListIdsContainingUserFromRds(sequelize, String(uid));
        mapped.userListArray = mergeUserListIds(mapped.userListArray, fromLists);
      }
    }
    return mapped;
  } catch {
    return null;
  }
}

/**
 * Admin: rows from user_list_subscriptions for a user (optional list name join).
 */
export async function getUserListSubscriptionRowsFromRds(userId) {
  const uid = String(userId || "").trim();
  if (!UUID_REGEX.test(uid)) return [];
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  if (!(await userListSubscriptionsTableExists(sequelize))) return [];
  try {
    const [rows] = await sequelize.query(
      `SELECT
        uls.user_list_subscription_id,
        uls.user_id,
        uls.newsletter_user_list_id,
        uls.created_at,
        nul.newsletter_user_list_name
       FROM public.user_list_subscriptions uls
       LEFT JOIN public.newsletter_user_lists nul
         ON nul.newsletter_user_list_id = uls.newsletter_user_list_id
       WHERE uls.user_id = :uid::uuid
       ORDER BY uls.created_at DESC NULLS LAST, uls.newsletter_user_list_id`,
      { replacements: { uid } }
    );
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    const msg = String(e?.message || "");
    if (msg.includes("user_list_subscriptions") || msg.includes("does not exist")) {
      return [];
    }
    throw e;
  }
}

/**
 * Admin: user_feed_preferences for a user, expanded per portal via topic_portals
 * (one row per preference × portal when a topic is linked to several portals).
 * Rows with portal_id NULL mean the topic has no topic_portals row (orphan).
 */
export async function getUserFeedPreferenceRowsFromRds(userId) {
  const uid = String(userId || "").trim();
  if (!UUID_REGEX.test(uid)) return [];
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  try {
    const [rows] = await sequelize.query(
      `SELECT
        ufp.user_feed_preference_id,
        ufp.user_id,
        ufp.topic_id,
        ufp.preference_state,
        t.topic_name,
        tp.portal_id
       FROM public.user_feed_preferences ufp
       LEFT JOIN public.topics_db t ON t.topic_id = ufp.topic_id
       LEFT JOIN public.topic_portals tp ON tp.topic_id = ufp.topic_id
       WHERE ufp.user_id = :uid::uuid
       ORDER BY tp.portal_id NULLS LAST, COALESCE(t.topic_name, ''), ufp.topic_id`,
      { replacements: { uid } }
    );
    return Array.isArray(rows) ? rows : [];
  } catch (e) {
    const msg = String(e?.message || "");
    if (
      msg.includes("user_feed_preferences") ||
      msg.includes("topics_db") ||
      msg.includes("topic_portals") ||
      msg.includes("does not exist")
    ) {
      return [];
    }
    throw e;
  }
}

/**
 * Admin: set `newsletter_user_lists.newsletter_list_type` to `main` or `specific`.
 * @param {string} listId - newsletter_user_list_id (UUID)
 * @param {"main"|"specific"} newsletterListType
 * @returns {Promise<object>} Updated list row (same shape as getUserListsFromRds items)
 */
export async function updateNewsletterUserListTypeInRds(listId, newsletterListType) {
  const id = String(listId || "").trim();
  if (!UUID_REGEX.test(id)) {
    throw new Error("Invalid list id");
  }
  const t = newsletterListType === "main" ? "main" : "specific";
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  const hasCol = await newsletterUserListsColumnExists(sequelize, "newsletter_list_type");
  if (!hasCol) {
    throw new Error("newsletter_list_type column missing on newsletter_user_lists");
  }
  const existsRows = await sequelize.query(
    `SELECT 1 AS ok FROM public.newsletter_user_lists WHERE newsletter_user_list_id = CAST(:id AS uuid) LIMIT 1`,
    { replacements: { id }, type: sequelize.QueryTypes.SELECT }
  );
  if (!Array.isArray(existsRows) || existsRows.length === 0) {
    throw new Error("List not found");
  }
  await sequelize.query(
    `UPDATE public.newsletter_user_lists
     SET newsletter_list_type = CAST(:t AS VARCHAR(32))
     WHERE newsletter_user_list_id = CAST(:id AS uuid)`,
    { replacements: { t, id } }
  );
  const lists = await getUserListsFromRds({});
  const row = lists.find((l) => l.userList_id === id);
  if (!row) {
    throw new Error("List not found after update");
  }
  return row;
}

/**
 * Admin: delete a newsletter list only when its resolved type is `specific` (same rules as getUserListsFromRds).
 * @param {string} listId
 */
export async function deleteNewsletterUserListIfSpecificInRds(listId) {
  const id = String(listId || "").trim();
  if (!UUID_REGEX.test(id)) {
    throw new Error("Invalid list id");
  }
  const lists = await getUserListsFromRds({});
  const row = lists.find((l) => l.userList_id === id);
  if (!row) {
    throw new Error("List not found");
  }
  if (row.newsletterListType === "main") {
    throw new Error("Cannot delete a main list. Only specific lists can be deleted.");
  }
  const db = Database.getInstance();
  if (!db.isConfigured()) {
    throw new Error("Database not configured");
  }
  const sequelize = db.getSequelize();
  await sequelize.query(
    `DELETE FROM public.newsletter_user_lists WHERE newsletter_user_list_id = CAST(:id AS uuid)`,
    { replacements: { id } }
  );
  return { ok: true };
}
