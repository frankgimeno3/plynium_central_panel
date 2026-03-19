import Database from "../../database/database.js";

const STATUS_VALUES = ["calendarized", "pending", "published", "cancelled"];

function toApiCampaign(row) {
  return {
    id: row.id_campaign,
    name: row.name ?? "",
    description: row.description ?? "",
    portalCode: row.portal_code ?? "",
    contentTheme: row.content_theme ?? "",
    frequency: row.frequency ?? "",
    startDate: row.start_date ? new Date(row.start_date).toISOString().split("T")[0] : "",
    endDate: row.end_date ? new Date(row.end_date).toISOString().split("T")[0] : "",
    status: row.status ?? "",
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

function toApiNewsletter(row) {
  let sentToLists = null;
  if (row.sent_to_lists != null) {
    // PG returns JSONB already parsed in most configs, but be defensive.
    const raw = row.sent_to_lists;
    sentToLists = Array.isArray(raw) ? raw.map(String) : null;
  }

  return {
    id: row.id_newsletter,
    campaignId: row.id_campaign,
    portalCode: row.portal_code ?? "",
    estimatedPublishDate: row.estimated_publish_date
      ? new Date(row.estimated_publish_date).toISOString().split("T")[0]
      : "",
    topic: row.topic ?? "",
    status: row.status,
    userNewsletterListId: row.user_newsletter_list_id ?? null,
    sentToLists,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : "",
  };
}

function toApiBlock(row) {
  return {
    id: row.id_block,
    newsletterId: row.id_newsletter,
    type: row.block_type,
    order: row.block_order,
    data: row.data ?? {},
  };
}

export async function getNewsletterCampaigns() {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    "SELECT id_campaign, name, description, portal_code, content_theme, frequency, start_date, end_date, status, created_at, updated_at FROM newsletter_campaigns ORDER BY created_at DESC"
  );
  return (Array.isArray(rows) ? rows : []).map(toApiCampaign);
}

export async function getNewsletters() {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    "SELECT id_newsletter, id_campaign, portal_code, estimated_publish_date, topic, status, user_newsletter_list_id, sent_to_lists, created_at, updated_at FROM newsletters ORDER BY estimated_publish_date DESC NULLS LAST, created_at DESC"
  );
  return (Array.isArray(rows) ? rows : []).map(toApiNewsletter);
}

export async function getNewsletterById(idNewsletter) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    "SELECT id_newsletter, id_campaign, portal_code, estimated_publish_date, topic, status, user_newsletter_list_id, sent_to_lists, created_at, updated_at FROM newsletters WHERE id_newsletter = :id_newsletter LIMIT 1",
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
    "SELECT id_block, id_newsletter, block_type, block_order, data FROM newsletter_content_blocks WHERE id_newsletter = :id_newsletter ORDER BY block_order ASC",
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

  const replacements = {
    id_newsletter: idNewsletter,
    status,
    user_newsletter_list_id: userNewsletterListId ?? null,
  };

  const sql = `
    UPDATE newsletters
    SET status = :status,
        user_newsletter_list_id = :user_newsletter_list_id,
        updated_at = NOW()
    WHERE id_newsletter = :id_newsletter
    RETURNING id_newsletter, id_campaign, portal_code, estimated_publish_date, topic, status, user_newsletter_list_id, sent_to_lists, created_at, updated_at
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Newsletter ${idNewsletter} not found`);
  return toApiNewsletter(rows[0]);
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
    SET block_type = :block_type,
        block_order = :block_order,
        data = :data,
        updated_at = NOW()
    WHERE id_newsletter = :id_newsletter AND id_block = :id_block
    RETURNING id_block, id_newsletter, block_type, block_order, data
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Newsletter block ${idBlock} not found`);
  return toApiBlock(rows[0]);
}

export async function createNewsletter(idNewsletter, { idCampaign, portalCode, estimatedPublishDate, topic, status, userNewsletterListId }) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const replacements = {
    id_newsletter: idNewsletter,
    id_campaign: idCampaign,
    portal_code: portalCode,
    estimated_publish_date: estimatedPublishDate ?? null,
    topic: topic ?? "",
    status,
    user_newsletter_list_id: userNewsletterListId ?? null,
  };

  const sql = `
    INSERT INTO newsletters (id_newsletter, id_campaign, portal_code, estimated_publish_date, topic, status, user_newsletter_list_id, sent_to_lists, created_at, updated_at)
    VALUES (:id_newsletter, :id_campaign, :portal_code, :estimated_publish_date, :topic, :status, :user_newsletter_list_id, NULL, NOW(), NOW())
    ON CONFLICT (id_newsletter) DO UPDATE SET
      id_campaign = EXCLUDED.id_campaign,
      portal_code = EXCLUDED.portal_code,
      estimated_publish_date = EXCLUDED.estimated_publish_date,
      topic = EXCLUDED.topic,
      status = EXCLUDED.status,
      user_newsletter_list_id = EXCLUDED.user_newsletter_list_id,
      updated_at = NOW()
    RETURNING id_newsletter, id_campaign, portal_code, estimated_publish_date, topic, status, user_newsletter_list_id, sent_to_lists, created_at, updated_at
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Unable to create newsletter ${idNewsletter}`);
  return toApiNewsletter(rows[0]);
}

