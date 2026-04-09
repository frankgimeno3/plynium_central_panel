import MagazineDbModel from "./MagazineDbModel.js";
import "../../database/models.js";

function toPlain(row) {
  return typeof row?.get === "function" ? row.get({ plain: true }) : row;
}

function toApiMagazine(row) {
  const p = toPlain(row);
  if (!p) return null;
  return {
    id_magazine: p.id_magazine,
    name: p.name ?? "",
    description: p.description ?? undefined,
    first_year: p.first_year ?? undefined,
    periodicity: p.periodicity ?? "",
    subscriber_number: p.subscriber_number ?? undefined,
  };
}

async function ensureModels() {
  if (!MagazineDbModel.sequelize) {
    console.warn("MagazineDbModel not initialized");
    return false;
  }
  return true;
}

export async function getAllMagazines() {
  try {
    if (!(await ensureModels())) return [];
    const rows = await MagazineDbModel.findAll({
      order: [["name", "ASC"]],
    });
    return rows.map((r) => toApiMagazine(r));
  } catch (error) {
    console.error("Error fetching magazines from database:", error);
    if (
      error.name === "SequelizeConnectionError" ||
      error.name === "SequelizeConnectionRefusedError" ||
      error.message?.includes("ETIMEDOUT") ||
      error.message?.includes("ECONNREFUSED") ||
      (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
      error.message?.includes("not initialized") ||
      error.message?.includes("Model not found")
    ) {
      console.warn("Database connection issue, returning empty array");
      return [];
    }
    throw error;
  }
}

export async function getMagazineById(idMagazine) {
  const row = await MagazineDbModel.findByPk(idMagazine);
  if (!row) {
    throw new Error(`Magazine with id ${idMagazine} not found`);
  }
  return toApiMagazine(row);
}

export async function createMagazine(data) {
  await ensureModels();
  const payload = {
    id_magazine: data.id_magazine,
    name: data.name,
    description: data.description ?? "",
    first_year: data.first_year ?? null,
    periodicity: data.periodicity != null ? String(data.periodicity).trim() : "",
    subscriber_number:
      data.subscriber_number != null && data.subscriber_number !== ""
        ? Number(data.subscriber_number)
        : null,
  };
  if (payload.subscriber_number != null && Number.isNaN(payload.subscriber_number)) {
    payload.subscriber_number = null;
  }
  await MagazineDbModel.create(payload);
  return getMagazineById(data.id_magazine);
}

export async function updateMagazine(idMagazine, body) {
  const row = await MagazineDbModel.findByPk(idMagazine);
  if (!row) {
    throw new Error(`Magazine with id ${idMagazine} not found`);
  }
  const updates = {};
  if (body.name !== undefined) updates.name = String(body.name).trim();
  if (body.description !== undefined) updates.description = (body.description ?? "").trim() || "";
  if (body.first_year !== undefined) updates.first_year = body.first_year == null ? null : Number(body.first_year);
  if (body.periodicity !== undefined) updates.periodicity = String(body.periodicity ?? "").trim();
  if (body.subscriber_number !== undefined) {
    updates.subscriber_number =
      body.subscriber_number == null || body.subscriber_number === ""
        ? null
        : Number(body.subscriber_number);
    if (updates.subscriber_number != null && Number.isNaN(updates.subscriber_number)) {
      updates.subscriber_number = null;
    }
  }
  if (Object.keys(updates).length > 0) {
    await row.update(updates);
  }
  return getMagazineById(idMagazine);
}

export function generateNextMagazineId(existingIds) {
  const prefix = "mag-";
  const numericIds = (existingIds || [])
    .map((id) => {
      const match = (id || "").replace(prefix, "").match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}${next}`;
}
