import TopicDbModel from "./TopicDbModel.js";
import "../../database/models.js";
import Database from "../../database/database.js";

function toPlain(row) {
  if (!row) return null;
  return row.get ? row.get({ plain: true }) : row;
}

export function toApiTopic(row) {
  const plain = toPlain(row);
  if (!plain) return null;
  return {
    topic_id: plain.topic_id,
    topic_portal_ids: Array.isArray(plain.topic_portal_ids)
      ? plain.topic_portal_ids.filter((n) => Number.isInteger(n) && n >= 0)
      : undefined,
    topic_name: plain.topic_name ?? "",
    topic_description: plain.topic_description ?? "",
    topic_created_at: plain.topic_created_at ?? null,
    topic_updated_at: plain.topic_updated_at ?? null,
  };
}

/**
 * @param {{ portalId?: number | null }} [opts]
 */
export async function getTopics(opts = {}) {
  if (!TopicDbModel.sequelize) {
    throw new Error("TopicDbModel not initialized");
  }
  const { portalId } = opts;
  const where = {};
  const rows = await TopicDbModel.findAll({
    where,
    order: [
      ["topic_name", "ASC"],
      ["topic_id", "ASC"],
    ],
  });

  const list = rows.map((r) => toApiTopic(r)).filter(Boolean);

  // Cargar relación many-to-many para todos (y filtrar por portal si aplica)
  try {
    const db = Database.getInstance();
    if (!db.isConfigured()) return list;
    const sequelize = db.getSequelize();
    const ids = list.map((t) => t.topic_id).filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) return list;
    const [relRows] = await sequelize.query(
      `SELECT topic_id, portal_id FROM topic_portals WHERE topic_id = ANY(:topicIds) ORDER BY topic_id ASC, portal_id ASC`,
      { replacements: { topicIds: ids } }
    );
    const byTopic = new Map();
    if (Array.isArray(relRows)) {
      for (const r of relRows) {
        const tid = r?.topic_id;
        const pid = r?.portal_id;
        if (!Number.isInteger(tid) || !Number.isInteger(pid) || pid < 0) continue;
        if (!byTopic.has(tid)) byTopic.set(tid, []);
        byTopic.get(tid).push(pid);
      }
    }
    const withPortals = list.map((t) => ({
      ...t,
      topic_portal_ids: (byTopic.get(t.topic_id) ?? []).filter((n) => Number.isInteger(n) && n >= 0),
    }));
    if (portalId != null && Number.isInteger(portalId)) {
      return withPortals.filter((t) => Array.isArray(t.topic_portal_ids) && t.topic_portal_ids.includes(portalId));
    }
    return withPortals;
  } catch {
    return list;
  }
}

/**
 * @param {string | number} topicId
 * @param {{ portalId?: number | null }} [opts]
 */
export async function getTopicById(topicId, opts = {}) {
  if (!TopicDbModel.sequelize) {
    throw new Error("TopicDbModel not initialized");
  }
  const id = typeof topicId === "number" ? topicId : parseInt(String(topicId), 10);
  if (!Number.isFinite(id)) {
    const err = new Error("Invalid topic_id");
    err.status = 400;
    throw err;
  }
  const { portalId } = opts;
  const where = { topic_id: id };
  const row = await TopicDbModel.findOne({ where });
  if (!row) {
    const err = new Error("Topic not found");
    err.status = 404;
    throw err;
  }
  const base = toApiTopic(row);

  // Cargar relación many-to-many si existe la tabla.
  try {
    const db = Database.getInstance();
    if (db.isConfigured()) {
      const sequelize = db.getSequelize();
      const [rows] = await sequelize.query(
        `SELECT portal_id FROM topic_portals WHERE topic_id = :topicId ORDER BY portal_id ASC`,
        { replacements: { topicId: base.topic_id } }
      );
      const portalIds = Array.isArray(rows)
        ? rows
            .map((r) => (r && typeof r === "object" ? r.portal_id : undefined))
            .map((n) => (Number.isFinite(Number(n)) ? Number(n) : null))
            .filter((n) => Number.isInteger(n) && n >= 0)
        : [];
      base.topic_portal_ids = portalIds;
    }
  } catch {
    // Si no existe la tabla o falla, no bloquear el endpoint.
  }

  if (!Array.isArray(base.topic_portal_ids) || base.topic_portal_ids.length === 0) {
    base.topic_portal_ids = [];
  }

  if (portalId != null && Number.isInteger(portalId)) {
    if (!base.topic_portal_ids.includes(portalId)) {
      const err = new Error("Topic not found");
      err.status = 404;
      throw err;
    }
  }
  return base;
}

/**
 * @param {string | number} topicId
 * @param {{ topic_name?: string, topic_description?: string, topic_portal?: number, topic_portal_ids?: number[] }} patch
 */
export async function updateTopicById(topicId, patch) {
  if (!TopicDbModel.sequelize) {
    throw new Error("TopicDbModel not initialized");
  }
  const id = typeof topicId === "number" ? topicId : parseInt(String(topicId), 10);
  if (!Number.isFinite(id)) {
    const err = new Error("Invalid topic_id");
    err.status = 400;
    throw err;
  }

  const update = {};
  if (patch && typeof patch.topic_name === "string") update.topic_name = patch.topic_name;
  if (patch && typeof patch.topic_description === "string") update.topic_description = patch.topic_description;

  // Compat: si llega topic_portal (legacy), mapearlo a topic_portal_ids
  if (patch && Number.isInteger(patch.topic_portal) && !Array.isArray(patch.topic_portal_ids)) {
    patch.topic_portal_ids = [patch.topic_portal];
  }
  if (patch && Array.isArray(patch.topic_portal_ids)) {
    const normalized = patch.topic_portal_ids
      .map((n) => (Number.isFinite(Number(n)) ? Number(n) : null))
      .filter((n) => Number.isInteger(n) && n >= 0);
    patch.topic_portal_ids = Array.from(new Set(normalized));
  }

  if (Object.keys(update).length === 0) {
    const err = new Error("No fields to update");
    err.status = 400;
    throw err;
  }

  const db = Database.getInstance();
  const sequelize = db.isConfigured() ? db.getSequelize() : null;

  const [count] = await TopicDbModel.update(update, { where: { topic_id: id } });
  if (!count) {
    const err = new Error("Topic not found");
    err.status = 404;
    throw err;
  }

  // Sincronizar relación many-to-many si el cliente envía portal_ids
  if (sequelize && patch && Array.isArray(patch.topic_portal_ids)) {
    const portalIds = patch.topic_portal_ids;
    if (portalIds.length === 0) {
      const err = new Error("At least 1 portal is required");
      err.status = 400;
      throw err;
    }
    try {
      await sequelize.transaction(async (t) => {
        await sequelize.query(`DELETE FROM topic_portals WHERE topic_id = :topicId`, {
          replacements: { topicId: id },
          transaction: t,
        });
        for (const portalId of portalIds) {
          await sequelize.query(
            `INSERT INTO topic_portals (topic_id, portal_id) VALUES (:topicId, :portalId)
             ON CONFLICT (topic_id, portal_id) DO NOTHING`,
            { replacements: { topicId: id, portalId }, transaction: t }
          );
        }
      });
    } catch {
      // Si falla (tabla no existe, etc.) no bloquear el guardado básico.
    }
  }
  const row = await TopicDbModel.findOne({ where: { topic_id: id } });
  const result = toApiTopic(row);
  if (patch && Array.isArray(patch.topic_portal_ids)) {
    result.topic_portal_ids = patch.topic_portal_ids;
  }
  return result;
}

/**
 * @param {{ topic_name: string, topic_description?: string, topic_portal_ids: number[] }} payload
 */
export async function createTopic(payload) {
  if (!TopicDbModel.sequelize) {
    throw new Error("TopicDbModel not initialized");
  }
  const name = typeof payload?.topic_name === "string" ? payload.topic_name.trim() : "";
  const description = typeof payload?.topic_description === "string" ? payload.topic_description : "";
  const portalIds = Array.isArray(payload?.topic_portal_ids)
    ? Array.from(
        new Set(
          payload.topic_portal_ids
            .map((n) => (Number.isFinite(Number(n)) ? Number(n) : null))
            .filter((n) => Number.isInteger(n) && n >= 0)
        )
      )
    : [];

  if (!name) {
    const err = new Error("topic_name is required");
    err.status = 400;
    throw err;
  }
  if (portalIds.length === 0) {
    const err = new Error("At least 1 portal is required");
    err.status = 400;
    throw err;
  }

  const db = Database.getInstance();
  if (!db.isConfigured()) {
    const err = new Error("Database not configured");
    err.status = 500;
    throw err;
  }
  const sequelize = db.getSequelize();

  const created = await sequelize.transaction(async (t) => {
    const row = await TopicDbModel.create(
      { topic_name: name, topic_description: description },
      { transaction: t }
    );
    for (const portalId of portalIds) {
      await sequelize.query(
        `INSERT INTO topic_portals (topic_id, portal_id) VALUES (:topicId, :portalId)
         ON CONFLICT (topic_id, portal_id) DO NOTHING`,
        { replacements: { topicId: row.topic_id, portalId }, transaction: t }
      );
    }
    return row;
  });

  const out = toApiTopic(created);
  out.topic_portal_ids = portalIds;
  return out;
}
