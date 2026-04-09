import Database from "../../database/database.js";

const STATUS_VALUES = ["calendarized", "pending", "published", "cancelled"];

const NEWSLETTER_ROW_SQL = `
  n.newsletter_id,
  n.newsletter_campaign_id,
  p.portal_name_key AS portal_code,
  n.newsletter_estimated_publication_date,
  n.newsletter_real_publication_date,
  n.newsletter_topic,
  n.newsletter_status,
  n.newsletter_user_list_id_array,
  n.newsletter_created_at,
  n.newsletter_updated_at
`;

function plannedPublicationDatesToApi(value) {
  if (!Array.isArray(value) || value.length === 0) return [];
  return value.map((d) => {
    if (d == null) return "";
    if (d instanceof Date) return d.toISOString().split("T")[0];
    const s = String(d);
    return s.includes("T") ? s.split("T")[0] : s.slice(0, 10);
  });
}

function toApiCampaign(row) {
  const start =
    row.newsletter_campaign_start_date ?? row.start_date;
  const end = row.newsletter_campaign_end_date ?? row.end_date;
  const created = row.newsletter_campaign_created_at ?? row.created_at;
  const updated = row.newsletter_campaign_updated_at ?? row.updated_at;
  return {
    id: row.newsletter_campaign_id ?? row.id_campaign,
    name: row.newsletter_campaign_name ?? row.name ?? "",
    description: row.newsletter_campaign_description ?? row.description ?? "",
    portalCode: row.portal_code ?? "",
    newsletterCampaign: row.newsletter_campaign ?? "",
    contentTheme: row.content_theme ?? "",
    frequency: row.newsletter_campaign_publication_frequency ?? row.frequency ?? "",
    startDate: start ? new Date(start).toISOString().split("T")[0] : "",
    endDate: end ? new Date(end).toISOString().split("T")[0] : "",
    plannedPublicationDates: plannedPublicationDatesToApi(
      row.newsletter_campaign_planned_publication_dates_array
    ),
    status: row.newsletter_campaign_status ?? row.status ?? "",
    createdAt: created ? new Date(created).toISOString() : "",
    updatedAt: updated ? new Date(updated).toISOString() : "",
  };
}

function toApiNewsletter(row) {
  const arr = row.newsletter_user_list_id_array;
  const ids = Array.isArray(arr) && arr.length ? arr.map((x) => String(x)) : [];
  const userNewsletterListId = ids[0] ?? null;
  const sentToLists = ids.length > 1 ? ids.slice(1) : null;

  return {
    id: row.newsletter_id,
    campaignId: row.newsletter_campaign_id,
    portalCode: row.portal_code ?? "",
    estimatedPublishDate: row.newsletter_estimated_publication_date
      ? new Date(row.newsletter_estimated_publication_date).toISOString().split("T")[0]
      : "",
    realPublicationDate: row.newsletter_real_publication_date
      ? new Date(row.newsletter_real_publication_date).toISOString().split("T")[0]
      : "",
    topic: row.newsletter_topic ?? "",
    status: row.newsletter_status,
    userNewsletterListId,
    sentToLists,
    createdAt: row.newsletter_created_at ? new Date(row.newsletter_created_at).toISOString() : "",
    updatedAt: row.newsletter_updated_at ? new Date(row.newsletter_updated_at).toISOString() : "",
  };
}

function toApiBlock(row) {
  const content = row.newsletter_block_content ?? row.data ?? {};
  return {
    id: row.newsletter_block_id ?? row.id_block,
    newsletterId: row.newsletter_id ?? row.id_newsletter,
    type: row.newsletter_block_type ?? row.block_type,
    order: row.newsletter_block_position ?? row.block_order,
    data: content,
  };
}

async function resolvePortalId(sequelize, portalCode) {
  const code = portalCode != null ? String(portalCode).trim() : "";
  if (!code) {
    throw new Error("portalCode is required");
  }
  const [rows] = await sequelize.query(
    `SELECT portal_id FROM portals_id
     WHERE portal_name_key = :code OR portal_name = :code OR CAST(portal_id AS TEXT) = :code
     LIMIT 1`,
    { replacements: { code } }
  );
  if (!rows || rows.length === 0) {
    throw new Error(`Unknown portal: ${portalCode}`);
  }
  return rows[0].portal_id;
}

export async function getNewsletterCampaigns() {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    `SELECT
      c.newsletter_campaign_id,
      c.newsletter_campaign_name,
      c.newsletter_campaign_description,
      p.portal_name_key AS portal_code,
      c.newsletter_campaign,
      c.content_theme,
      c.newsletter_campaign_publication_frequency,
      c.newsletter_campaign_start_date,
      c.newsletter_campaign_end_date,
      c.newsletter_campaign_planned_publication_dates_array,
      c.newsletter_campaign_status,
      c.newsletter_campaign_created_at,
      c.newsletter_campaign_updated_at
     FROM newsletter_campaigns c
     LEFT JOIN portals_id p ON p.portal_id = c.portal_id
     ORDER BY c.newsletter_campaign_created_at DESC`
  );
  return (Array.isArray(rows) ? rows : []).map(toApiCampaign);
}

export async function getNewsletters() {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    `SELECT ${NEWSLETTER_ROW_SQL}
     FROM newsletters_db n
     LEFT JOIN portals_id p ON p.portal_id = n.portal_id
     ORDER BY n.newsletter_estimated_publication_date DESC NULLS LAST, n.newsletter_created_at DESC`
  );
  return (Array.isArray(rows) ? rows : []).map(toApiNewsletter);
}

export async function getNewsletterById(idNewsletter) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    `SELECT ${NEWSLETTER_ROW_SQL}
     FROM newsletters_db n
     LEFT JOIN portals_id p ON p.portal_id = n.portal_id
     WHERE n.newsletter_id = :id_newsletter LIMIT 1`,
    { replacements: { id_newsletter: idNewsletter } }
  );
  if (!rows || rows.length === 0) return null;
  return toApiNewsletter(rows[0]);
}

export async function getNewsletterBlocks(idNewsletter) {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    `SELECT newsletter_block_id, newsletter_id, newsletter_block_type, newsletter_block_position, newsletter_block_content
     FROM newsletter_content_blocks
     WHERE newsletter_id = :id_newsletter
     ORDER BY newsletter_block_position ASC`,
    { replacements: { id_newsletter: idNewsletter } }
  );
  return (Array.isArray(rows) ? rows : []).map(toApiBlock);
}

export async function updateNewsletterStatus(idNewsletter, { status, userNewsletterListId }) {
  if (!STATUS_VALUES.includes(status)) {
    throw new Error(`Invalid newsletter status: ${status}`);
  }

  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const patchList = userNewsletterListId !== undefined;
  const listValue = userNewsletterListId == null || userNewsletterListId === "" ? null : String(userNewsletterListId).trim();

  const replacements = {
    id_newsletter: idNewsletter,
    status,
    patch_list: patchList,
    user_newsletter_list_id: listValue,
  };

  const sql = `
    UPDATE newsletters_db n
    SET newsletter_status = :status,
        newsletter_user_list_id_array = CASE
          WHEN NOT :patch_list THEN n.newsletter_user_list_id_array
          WHEN :user_newsletter_list_id IS NULL OR CAST(:user_newsletter_list_id AS TEXT) = '' THEN NULL
          ELSE ARRAY[CAST(:user_newsletter_list_id AS UUID)]
        END,
        newsletter_real_publication_date = CASE
          WHEN :status = 'published' AND n.newsletter_real_publication_date IS NULL THEN CURRENT_DATE
          ELSE n.newsletter_real_publication_date
        END,
        newsletter_updated_at = NOW()
    WHERE n.newsletter_id = :id_newsletter
    RETURNING n.newsletter_id
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Newsletter ${idNewsletter} not found`);
  return getNewsletterById(idNewsletter);
}

export async function updateNewsletterContentBlock(idNewsletter, idBlock, { blockType, order, data }) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const replacements = {
    id_newsletter: idNewsletter,
    id_block: idBlock,
    block_type: blockType,
    block_order: order,
    data: data ?? {},
  };

  const sql = `
    UPDATE newsletter_content_blocks
    SET newsletter_block_type = :block_type,
        newsletter_block_position = :block_order,
        newsletter_block_content = :data
    WHERE newsletter_id = :id_newsletter AND newsletter_block_id = :id_block
    RETURNING newsletter_block_id, newsletter_id, newsletter_block_type, newsletter_block_position, newsletter_block_content
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Newsletter block ${idBlock} not found`);
  return toApiBlock(rows[0]);
}

export async function createNewsletter(idNewsletter, { idCampaign, portalCode, estimatedPublishDate, topic, status, userNewsletterListId }) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const portal_id = await resolvePortalId(sequelize, portalCode);
  const listTrim =
    userNewsletterListId == null || userNewsletterListId === "" ? null : String(userNewsletterListId).trim();

  const replacements = {
    id_newsletter: idNewsletter,
    id_campaign: idCampaign,
    portal_id,
    estimated_publish_date: estimatedPublishDate ?? null,
    topic: topic ?? "",
    status,
    user_newsletter_list_id: listTrim,
  };

  const sql = `
    INSERT INTO newsletters_db (
      newsletter_id, newsletter_campaign_id, portal_id,
      newsletter_estimated_publication_date, newsletter_topic, newsletter_status,
      newsletter_user_list_id_array, newsletter_created_at, newsletter_updated_at
    )
    VALUES (
      :id_newsletter, :id_campaign, :portal_id,
      :estimated_publish_date, :topic, :status,
      CASE
        WHEN :user_newsletter_list_id IS NULL OR CAST(:user_newsletter_list_id AS TEXT) = '' THEN NULL
        ELSE ARRAY[CAST(:user_newsletter_list_id AS UUID)]
      END,
      NOW(), NOW()
    )
    ON CONFLICT (newsletter_id) DO UPDATE SET
      newsletter_campaign_id = EXCLUDED.newsletter_campaign_id,
      portal_id = EXCLUDED.portal_id,
      newsletter_estimated_publication_date = EXCLUDED.newsletter_estimated_publication_date,
      newsletter_topic = EXCLUDED.newsletter_topic,
      newsletter_status = EXCLUDED.newsletter_status,
      newsletter_user_list_id_array = EXCLUDED.newsletter_user_list_id_array,
      newsletter_updated_at = NOW()
    RETURNING newsletter_id
  `;

  await sequelize.query(sql, { replacements });
  return getNewsletterById(idNewsletter);
}
