import Database from "../../database/database.js";
import {
  createDefaultCampaignLayoutConfig,
  normalizeCampaignLayoutConfig,
} from "./campaignLayoutDefaults.js";

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
  n.newsletter_layout_config,
  c.newsletter_type AS campaign_newsletter_type,
  n.newsletter_created_at,
  n.newsletter_updated_at
`;

const CAMPAIGN_ROW_SQL = `
  c.newsletter_campaign_id,
  c.newsletter_campaign_name,
  c.newsletter_campaign_description,
  p.portal_name_key AS portal_code,
  c.newsletter_type,
  c.content_theme,
  c.newsletter_campaign_publication_frequency,
  c.newsletter_campaign_status,
  c.newsletter_campaign_layout_config,
  c.newsletter_campaign_created_at,
  c.newsletter_campaign_updated_at
`;

function toApiCampaign(row) {
  const created = row.newsletter_campaign_created_at ?? row.created_at;
  const updated = row.newsletter_campaign_updated_at ?? row.updated_at;
  const newsletterType = row.newsletter_type ?? "main";
  return {
    id: row.newsletter_campaign_id ?? row.id_campaign,
    name: row.newsletter_campaign_name ?? row.name ?? "",
    description: row.newsletter_campaign_description ?? row.description ?? "",
    portalCode: row.portal_code ?? "",
    newsletterType,
    contentTheme: row.content_theme ?? "",
    frequency: row.newsletter_campaign_publication_frequency ?? row.frequency ?? "",
    status: row.newsletter_campaign_status ?? row.status ?? "",
    layoutConfig: normalizeCampaignLayoutConfig(
      row.newsletter_campaign_layout_config,
      newsletterType
    ),
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
    userNewsletterListIds: ids,
    userNewsletterListId,
    sentToLists,
    layoutEditionConfig:
      row.newsletter_layout_config == null
        ? null
        : normalizeCampaignLayoutConfig(row.newsletter_layout_config, row.campaign_newsletter_type),
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
    `SELECT ${CAMPAIGN_ROW_SQL}
     FROM newsletter_campaigns c
     LEFT JOIN portals_id p ON p.portal_id = c.portal_id
     ORDER BY c.newsletter_campaign_created_at DESC`
  );
  return (Array.isArray(rows) ? rows : []).map(toApiCampaign);
}

export async function createNewsletterCampaign(idCampaign, payload) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const id = String(idCampaign ?? "").trim();
  if (!id) throw new Error("Campaign id is required");

  const name = String(payload?.name ?? "").trim();
  if (!name) throw new Error("Campaign name is required");

  const description = payload?.description !== undefined ? String(payload.description) : "";
  const newsletterTypeRaw = String(payload?.newsletterType ?? "main").trim().toLowerCase();
  const newsletterType = newsletterTypeRaw === "specific" ? "specific" : "main";
  const contentTheme = payload?.contentTheme !== undefined ? String(payload.contentTheme) : "";
  const frequency = String(payload?.frequency ?? "").trim();
  if (!frequency) throw new Error("Campaign frequency is required");
  const status = String(payload?.status ?? "draft").trim() || "draft";
  const portalCode = payload?.portalCode;
  const portal_id = await resolvePortalId(sequelize, portalCode);
  const layoutConfig = createDefaultCampaignLayoutConfig(newsletterType);

  const [existingRows] = await sequelize.query(
    `SELECT newsletter_campaign_id
     FROM newsletter_campaigns
     WHERE newsletter_campaign_id = :id_campaign
     LIMIT 1`,
    { replacements: { id_campaign: id } }
  );
  if (existingRows && existingRows.length > 0) {
    throw new Error(`Campaign ${id} already exists`);
  }

  const transaction = await sequelize.transaction();
  try {
    await sequelize.query(
      `INSERT INTO newsletter_campaigns (
        newsletter_campaign_id,
        newsletter_campaign_name,
        newsletter_campaign_description,
        portal_id,
        newsletter_type,
        content_theme,
        newsletter_campaign_publication_frequency,
        newsletter_campaign_status,
        newsletter_campaign_layout_config,
        newsletter_campaign_created_at,
        newsletter_campaign_updated_at
      )
      VALUES (
        :id_campaign,
        :name,
        :description,
        :portal_id,
        :newsletter_type,
        :content_theme,
        :frequency,
        :status,
        CAST(:layout_config AS JSONB),
        NOW(),
        NOW()
      )`,
      {
        replacements: {
          id_campaign: id,
          name,
          description,
          portal_id,
          newsletter_type: newsletterType,
          content_theme: contentTheme,
          frequency,
          status,
          layout_config: JSON.stringify(layoutConfig),
        },
        transaction,
      }
    );

    await sequelize.query(
      `INSERT INTO newsletter_campaign_portals (newsletter_campaign_id, portal_id)
       VALUES (:id_campaign, :portal_id)
       ON CONFLICT (newsletter_campaign_id, portal_id) DO NOTHING`,
      { replacements: { id_campaign: id, portal_id }, transaction }
    );

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  const [rows] = await sequelize.query(
    `SELECT ${CAMPAIGN_ROW_SQL}
     FROM newsletter_campaigns c
     LEFT JOIN portals_id p ON p.portal_id = c.portal_id
     WHERE c.newsletter_campaign_id = :id_campaign
     LIMIT 1`,
    { replacements: { id_campaign: id } }
  );
  if (!rows || rows.length === 0) throw new Error(`Campaign ${id} not found`);
  return toApiCampaign(rows[0]);
}

export async function updateNewsletterCampaign(idCampaign, patch) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const name = patch?.name !== undefined ? String(patch.name) : undefined;
  const description = patch?.description !== undefined ? String(patch.description) : undefined;
  const newsletterType =
    patch?.newsletterType !== undefined ? String(patch.newsletterType).trim().toLowerCase() : undefined;
  const contentTheme = patch?.contentTheme !== undefined ? String(patch.contentTheme) : undefined;
  const frequency = patch?.frequency !== undefined ? String(patch.frequency) : undefined;
  const status = patch?.status !== undefined ? String(patch.status) : undefined;
  const layoutConfig =
    patch?.layoutConfig !== undefined
      ? normalizeCampaignLayoutConfig(patch.layoutConfig, newsletterType)
      : undefined;

  const hasAny =
    name !== undefined ||
    description !== undefined ||
    newsletterType !== undefined ||
    contentTheme !== undefined ||
    frequency !== undefined ||
    status !== undefined ||
    layoutConfig !== undefined;
  if (!hasAny) throw new Error("No fields to update");

  if (newsletterType !== undefined && newsletterType !== "main" && newsletterType !== "specific") {
    throw new Error(`Invalid newsletterType: ${newsletterType}`);
  }

  const replacements = {
    id_campaign: idCampaign,
    patch_name: name !== undefined,
    patch_description: description !== undefined,
    patch_type: newsletterType !== undefined,
    patch_theme: contentTheme !== undefined,
    patch_frequency: frequency !== undefined,
    patch_status: status !== undefined,
    patch_layout: layoutConfig !== undefined,
    name,
    description,
    newsletter_type: newsletterType,
    content_theme: contentTheme,
    frequency,
    status,
    layout_config: layoutConfig !== undefined ? JSON.stringify(layoutConfig) : null,
  };

  const sql = `
    UPDATE newsletter_campaigns c
    SET newsletter_campaign_name = CASE WHEN :patch_name THEN :name ELSE c.newsletter_campaign_name END,
        newsletter_campaign_description = CASE WHEN :patch_description THEN :description ELSE c.newsletter_campaign_description END,
        newsletter_type = CASE WHEN :patch_type THEN :newsletter_type ELSE c.newsletter_type END,
        content_theme = CASE WHEN :patch_theme THEN :content_theme ELSE c.content_theme END,
        newsletter_campaign_publication_frequency = CASE WHEN :patch_frequency THEN :frequency ELSE c.newsletter_campaign_publication_frequency END,
        newsletter_campaign_status = CASE WHEN :patch_status THEN :status ELSE c.newsletter_campaign_status END,
        newsletter_campaign_layout_config = CASE
          WHEN :patch_layout THEN CAST(:layout_config AS JSONB)
          ELSE c.newsletter_campaign_layout_config
        END,
        newsletter_campaign_updated_at = NOW()
    WHERE c.newsletter_campaign_id = :id_campaign
    RETURNING c.newsletter_campaign_id
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Campaign ${idCampaign} not found`);

  const [outRows] = await sequelize.query(
    `SELECT ${CAMPAIGN_ROW_SQL}
     FROM newsletter_campaigns c
     LEFT JOIN portals_id p ON p.portal_id = c.portal_id
     WHERE c.newsletter_campaign_id = :id_campaign
     LIMIT 1`,
    { replacements: { id_campaign: idCampaign } }
  );
  if (!outRows || outRows.length === 0) throw new Error(`Campaign ${idCampaign} not found`);
  return toApiCampaign(outRows[0]);
}

export async function getNewsletterCampaignPortals(idCampaign) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const [rows] = await sequelize.query(
    `SELECT p.portal_id AS id, p.portal_name_key AS key, p.portal_name AS name
     FROM newsletter_campaign_portals cp
     INNER JOIN portals_db p ON p.portal_id = cp.portal_id
     WHERE cp.newsletter_campaign_id = :id_campaign
     ORDER BY p.portal_id ASC`,
    { replacements: { id_campaign: idCampaign } }
  );

  return Array.isArray(rows) ? rows.map((r) => ({ id: r.id, key: r.key, name: r.name })) : [];
}

export async function addNewsletterCampaignPortals(idCampaign, portalIds) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const ids = Array.isArray(portalIds)
    ? portalIds
        .map((x) => Number(x))
        .filter((x) => Number.isFinite(x))
        .map((x) => Math.trunc(x))
    : [];
  if (ids.length === 0) throw new Error("portalIds must include at least one portal");

  // Ensure campaign exists and fetch primary portal_id
  const [campRows] = await sequelize.query(
    `SELECT portal_id FROM newsletter_campaigns WHERE newsletter_campaign_id = :id_campaign LIMIT 1`,
    { replacements: { id_campaign: idCampaign } }
  );
  if (!campRows || campRows.length === 0) throw new Error(`Campaign ${idCampaign} not found`);
  const primaryPortalId = campRows[0].portal_id;

  // Always ensure the primary portal exists in the bridge
  const all = Array.from(new Set([primaryPortalId, ...ids]));
  const valuesSql = all.map((_, i) => `(:id_campaign, :p${i})`).join(", ");
  const replacements = { id_campaign: idCampaign };
  all.forEach((p, i) => {
    replacements[`p${i}`] = p;
  });

  await sequelize.query(
    `INSERT INTO newsletter_campaign_portals (newsletter_campaign_id, portal_id)
     VALUES ${valuesSql}
     ON CONFLICT (newsletter_campaign_id, portal_id) DO NOTHING`,
    { replacements }
  );

  return getNewsletterCampaignPortals(idCampaign);
}

export async function removeNewsletterCampaignPortal(idCampaign, portalId) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const pid = Number(portalId);
  if (!Number.isFinite(pid)) throw new Error("portalId must be a number");

  // Confirm campaign exists and current primary portal_id
  const [campRows] = await sequelize.query(
    `SELECT portal_id FROM newsletter_campaigns WHERE newsletter_campaign_id = :id_campaign LIMIT 1`,
    { replacements: { id_campaign: idCampaign } }
  );
  if (!campRows || campRows.length === 0) throw new Error(`Campaign ${idCampaign} not found`);
  const currentPrimary = campRows[0].portal_id;

  await sequelize.query(
    `DELETE FROM newsletter_campaign_portals
     WHERE newsletter_campaign_id = :id_campaign AND portal_id = :portal_id`,
    { replacements: { id_campaign: idCampaign, portal_id: pid } }
  );

  const remaining = await getNewsletterCampaignPortals(idCampaign);
  if (remaining.length === 0) {
    // restore at least one (rollback-friendly via explicit insert)
    await sequelize.query(
      `INSERT INTO newsletter_campaign_portals (newsletter_campaign_id, portal_id)
       VALUES (:id_campaign, :portal_id)
       ON CONFLICT (newsletter_campaign_id, portal_id) DO NOTHING`,
      { replacements: { id_campaign: idCampaign, portal_id: currentPrimary } }
    );
    throw new Error("A campaign must have at least one portal");
  }

  // If we removed the primary portal, move primary to the smallest remaining portal_id
  if (pid === currentPrimary) {
    const nextPrimary = remaining[0].id;
    await sequelize.query(
      `UPDATE newsletter_campaigns
       SET portal_id = :portal_id, newsletter_campaign_updated_at = NOW()
       WHERE newsletter_campaign_id = :id_campaign`,
      { replacements: { id_campaign: idCampaign, portal_id: nextPrimary } }
    );
  }

  return remaining;
}

export async function getNewslettersByCampaignAndPortal(idCampaign, portalId) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const pid = Number(portalId);
  if (!Number.isFinite(pid)) throw new Error("portalId must be a number");

  const [rows] = await sequelize.query(
    `SELECT ${NEWSLETTER_ROW_SQL}
     FROM newsletters_db n
     LEFT JOIN portals_id p ON p.portal_id = n.portal_id
     LEFT JOIN newsletter_campaigns c ON c.newsletter_campaign_id = n.newsletter_campaign_id
     WHERE n.newsletter_campaign_id = :id_campaign
       AND n.portal_id = :portal_id
     ORDER BY n.newsletter_estimated_publication_date DESC NULLS LAST, n.newsletter_created_at DESC`,
    { replacements: { id_campaign: idCampaign, portal_id: pid } }
  );
  return (Array.isArray(rows) ? rows : []).map(toApiNewsletter);
}

export async function getNewslettersByCampaign(idCampaign) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const [rows] = await sequelize.query(
    `SELECT ${NEWSLETTER_ROW_SQL}
     FROM newsletters_db n
     LEFT JOIN portals_id p ON p.portal_id = n.portal_id
     LEFT JOIN newsletter_campaigns c ON c.newsletter_campaign_id = n.newsletter_campaign_id
     WHERE n.newsletter_campaign_id = :id_campaign
     ORDER BY n.newsletter_estimated_publication_date DESC NULLS LAST, n.newsletter_created_at DESC`,
    { replacements: { id_campaign: idCampaign } }
  );
  return (Array.isArray(rows) ? rows : []).map(toApiNewsletter);
}

export async function deleteNewsletterCampaign(idCampaign) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const transaction = await sequelize.transaction();
  try {
    const [rows] = await sequelize.query(
      `SELECT newsletter_campaign_id FROM newsletter_campaigns WHERE newsletter_campaign_id = :id_campaign LIMIT 1`,
      { replacements: { id_campaign: idCampaign }, transaction }
    );
    if (!rows || rows.length === 0) {
      throw new Error(`Campaign ${idCampaign} not found`);
    }

    // Delete content blocks for newsletters in this campaign
    await sequelize.query(
      `DELETE FROM newsletter_content_blocks b
       USING newsletters_db n
       WHERE b.newsletter_id = n.newsletter_id
         AND n.newsletter_campaign_id = :id_campaign`,
      { replacements: { id_campaign: idCampaign }, transaction }
    );

    // Delete newsletters for this campaign
    await sequelize.query(
      `DELETE FROM newsletters_db WHERE newsletter_campaign_id = :id_campaign`,
      { replacements: { id_campaign: idCampaign }, transaction }
    );

    // Delete portal associations
    await sequelize.query(
      `DELETE FROM newsletter_campaign_portals WHERE newsletter_campaign_id = :id_campaign`,
      { replacements: { id_campaign: idCampaign }, transaction }
    );

    // Delete campaign
    await sequelize.query(
      `DELETE FROM newsletter_campaigns WHERE newsletter_campaign_id = :id_campaign`,
      { replacements: { id_campaign: idCampaign }, transaction }
    );

    await transaction.commit();
    return { ok: true };
  } catch (e) {
    await transaction.rollback();
    throw e;
  }
}

export async function getNewsletters() {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const [rows] = await sequelize.query(
    `SELECT ${NEWSLETTER_ROW_SQL}
     FROM newsletters_db n
     LEFT JOIN portals_id p ON p.portal_id = n.portal_id
     LEFT JOIN newsletter_campaigns c ON c.newsletter_campaign_id = n.newsletter_campaign_id
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
     LEFT JOIN newsletter_campaigns c ON c.newsletter_campaign_id = n.newsletter_campaign_id
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

function normalizeNewsletterListIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => String(id ?? "").trim()).filter(Boolean))];
}

export async function updateNewsletter(idNewsletter, patch = {}) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const hasStatus = patch.status !== undefined;
  const hasTopic = patch.topic !== undefined;
  const hasEstimatedPublishDate = patch.estimatedPublishDate !== undefined;
  const hasListIds = patch.userNewsletterListIds !== undefined;
  const hasLegacyListId = patch.userNewsletterListId !== undefined;
  const hasLayoutEdition = patch.layoutEditionConfig !== undefined;
  const layoutEditionConfig = hasLayoutEdition
    ? patch.layoutEditionConfig == null
      ? null
      : normalizeCampaignLayoutConfig(patch.layoutEditionConfig)
    : undefined;

  if (
    !hasStatus &&
    !hasTopic &&
    !hasEstimatedPublishDate &&
    !hasListIds &&
    !hasLegacyListId &&
    !hasLayoutEdition
  ) {
    throw new Error("No fields to update");
  }

  if (hasStatus && !STATUS_VALUES.includes(patch.status)) {
    throw new Error(`Invalid newsletter status: ${patch.status}`);
  }

  const listIds = hasListIds
    ? normalizeNewsletterListIds(patch.userNewsletterListIds)
    : hasLegacyListId
      ? patch.userNewsletterListId == null || patch.userNewsletterListId === ""
        ? []
        : [String(patch.userNewsletterListId).trim()]
      : null;

  const replacements = {
    id_newsletter: idNewsletter,
    patch_status: hasStatus,
    status: hasStatus ? patch.status : null,
    patch_topic: hasTopic,
    topic: hasTopic ? String(patch.topic ?? "") : null,
    patch_estimated_publish_date: hasEstimatedPublishDate,
    estimated_publish_date:
      hasEstimatedPublishDate && patch.estimatedPublishDate
        ? String(patch.estimatedPublishDate).trim()
        : null,
    patch_lists: hasListIds || hasLegacyListId,
    clear_lists: listIds != null && listIds.length === 0,
    patch_layout_edition: hasLayoutEdition,
    clear_layout_edition: hasLayoutEdition && layoutEditionConfig == null,
    layout_edition_config:
      hasLayoutEdition && layoutEditionConfig != null ? JSON.stringify(layoutEditionConfig) : null,
  };

  listIds?.forEach((id, index) => {
    replacements[`list_id_${index}`] = id;
  });

  const listArraySql =
    listIds == null
      ? "n.newsletter_user_list_id_array"
      : listIds.length === 0
        ? "NULL"
        : `ARRAY[${listIds.map((_, index) => `CAST(:list_id_${index} AS UUID)`).join(", ")}]`;

  const sql = `
    UPDATE newsletters_db n
    SET newsletter_status = CASE WHEN :patch_status THEN :status ELSE n.newsletter_status END,
        newsletter_topic = CASE WHEN :patch_topic THEN :topic ELSE n.newsletter_topic END,
        newsletter_estimated_publication_date = CASE
          WHEN NOT :patch_estimated_publish_date THEN n.newsletter_estimated_publication_date
          WHEN :estimated_publish_date IS NULL OR CAST(:estimated_publish_date AS TEXT) = '' THEN NULL
          ELSE CAST(:estimated_publish_date AS DATE)
        END,
        newsletter_user_list_id_array = CASE
          WHEN NOT :patch_lists THEN n.newsletter_user_list_id_array
          WHEN :clear_lists THEN NULL
          ELSE ${listArraySql}
        END,
        newsletter_real_publication_date = CASE
          WHEN :patch_status AND :status = 'published' AND n.newsletter_real_publication_date IS NULL THEN CURRENT_DATE
          ELSE n.newsletter_real_publication_date
        END,
        newsletter_layout_config = CASE
          WHEN NOT :patch_layout_edition THEN n.newsletter_layout_config
          WHEN :clear_layout_edition THEN NULL
          ELSE CAST(:layout_edition_config AS JSONB)
        END,
        newsletter_updated_at = NOW()
    WHERE n.newsletter_id = :id_newsletter
    RETURNING n.newsletter_id
  `;

  const [rows] = await sequelize.query(sql, { replacements });
  if (!rows || rows.length === 0) throw new Error(`Newsletter ${idNewsletter} not found`);
  return getNewsletterById(idNewsletter);
}

export async function updateNewsletterStatus(idNewsletter, { status, userNewsletterListId }) {
  return updateNewsletter(idNewsletter, { status, userNewsletterListId });
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

export async function createNewsletterContentBlocks(idNewsletter, blocks) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const rows = Array.isArray(blocks) ? blocks : [];
  if (rows.length === 0) return getNewsletterBlocks(idNewsletter);

  const transaction = await sequelize.transaction();
  try {
    for (const block of rows) {
      const idBlock = String(block?.id ?? "").trim();
      if (!idBlock) throw new Error("Block id is required");
      const blockType = String(block?.blockType ?? block?.type ?? "").trim();
      if (!blockType) throw new Error("Block type is required");
      const order = Number(block?.order ?? block?.position ?? 0);
      const data = block?.data ?? {};

      await sequelize.query(
        `INSERT INTO newsletter_content_blocks (
          newsletter_id,
          newsletter_block_id,
          newsletter_block_type,
          newsletter_block_position,
          newsletter_block_content,
          newsletter_block_created_at,
          newsletter_block_updated_at
        )
        VALUES (
          :id_newsletter,
          :id_block,
          :block_type,
          :block_order,
          CAST(:data AS JSONB),
          NOW(),
          NOW()
        )`,
        {
          replacements: {
            id_newsletter: idNewsletter,
            id_block: idBlock,
            block_type: blockType,
            block_order: Number.isFinite(order) ? order : 0,
            data: JSON.stringify(data),
          },
          transaction,
        }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return getNewsletterBlocks(idNewsletter);
}

export async function reorderNewsletterContentBlocks(idNewsletter, orderedBlockIds) {
  const db = Database.getInstance();
  if (!db.isConfigured()) throw new Error("Database not configured");
  const sequelize = db.getSequelize();

  const ids = Array.isArray(orderedBlockIds)
    ? orderedBlockIds.map((id) => String(id ?? "").trim()).filter(Boolean)
    : [];
  if (ids.length === 0) throw new Error("orderedBlockIds is required");

  const transaction = await sequelize.transaction();
  try {
    for (let index = 0; index < ids.length; index += 1) {
      await sequelize.query(
        `UPDATE newsletter_content_blocks
         SET newsletter_block_position = :block_order,
             newsletter_block_updated_at = NOW()
         WHERE newsletter_id = :id_newsletter
           AND newsletter_block_id = :id_block`,
        {
          replacements: {
            id_newsletter: idNewsletter,
            id_block: ids[index],
            block_order: index,
          },
          transaction,
        }
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  return getNewsletterBlocks(idNewsletter);
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

const NEWSLETTER_PROJECT_SERVICE_IDS = ["newsletter_banner", "newsletter_sponsored_space"];

export async function listRelatedProjectsForNewsletter(idNewsletter) {
  const db = Database.getInstance();
  if (!db.isConfigured()) return [];
  const sequelize = db.getSequelize();
  const newsletterId = String(idNewsletter ?? "").trim();
  if (!newsletterId) return [];

  let rows = [];
  try {
    const [result] = await sequelize.query(
      `SELECT
        p.project_id,
        p.contract_id,
        p.project_title,
        p.project_status,
        p.service_id,
        p.project_publication_date,
        c.contract_title,
        cu.customer_account_name AS customer_name,
        s.service_full_name
      FROM public.projects_db p
      CROSS JOIN LATERAL (
        SELECT
          n.newsletter_estimated_publication_date,
          n.newsletter_real_publication_date
        FROM public.newsletters_db n
        WHERE n.newsletter_id = :id_newsletter
        LIMIT 1
      ) nr
      LEFT JOIN public.contracts_db c ON c.contract_id = p.contract_id
      LEFT JOIN public.customers_db cu ON cu.customer_id = c.customer_id
      LEFT JOIN public.services_db s ON s.service_id = p.service_id
      WHERE EXISTS (
        SELECT 1
        FROM public.newsletters_db n
        WHERE n.newsletter_id = :id_newsletter
      )
      AND (
        EXISTS (
          SELECT 1
          FROM public.newsletter_content_blocks b
          WHERE b.newsletter_id = :id_newsletter
            AND NULLIF(TRIM(b.newsletter_block_content->>'projectId'), '') = p.project_id
        )
        OR (
          p.service_id IN (:newsletter_service_ids)
          AND (
            (
              nr.newsletter_estimated_publication_date IS NOT NULL
              AND p.project_publication_date = nr.newsletter_estimated_publication_date
            )
            OR (
              nr.newsletter_real_publication_date IS NOT NULL
              AND p.project_publication_date = nr.newsletter_real_publication_date
            )
          )
        )
      )
      ORDER BY p.project_created_at ASC`,
      {
        replacements: {
          id_newsletter: newsletterId,
          newsletter_service_ids: NEWSLETTER_PROJECT_SERVICE_IDS,
        },
      }
    );
    rows = Array.isArray(result) ? result : [];
  } catch (error) {
    console.warn(
      "[NewsletterDbService] listRelatedProjectsForNewsletter failed:",
      error?.message ?? error
    );
    return [];
  }

  return rows.map((row) => ({
    project_id: row.project_id ?? "",
    contract_id: row.contract_id ?? "",
    project_title: row.project_title ?? "",
    project_status: row.project_status ?? "",
    service_id: row.service_id ?? "",
    service_full_name: row.service_full_name ?? null,
    project_publication_date: row.project_publication_date ?? null,
    customer_name: row.customer_name ?? "",
    contract_title: row.contract_title ?? "",
  }));
}
