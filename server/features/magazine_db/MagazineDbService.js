import MagazineDbModel from "./MagazineDbModel.js";
import MagazineIssueDbModel from "./MagazineIssueDbModel.js";
import "../../database/models.js";

function toPlain(row) {
  return typeof row?.get === "function" ? row.get({ plain: true }) : row;
}

function toApiIssue(row) {
  const p = toPlain(row);
  if (!p) return null;
  const issue = {
    issue_number: p.issue_number,
    is_special_edition: Boolean(p.is_special_edition),
  };
  if (p.special_topic) issue.special_topic = p.special_topic;
  if (p.forecasted_publication_month != null) issue.forecasted_publication_month = p.forecasted_publication_month;
  return issue;
}

function toApiMagazine(row, issuesByYear = {}) {
  const p = toPlain(row);
  if (!p) return null;
  return {
    id_magazine: p.id_magazine,
    name: p.name ?? "",
    description: p.description ?? undefined,
    first_year: p.first_year ?? undefined,
    last_year: p.last_year ?? undefined,
    notes: p.notes ?? undefined,
    portal_name: p.portal_name ?? undefined,
    issues_by_year: Object.keys(issuesByYear).length > 0 ? issuesByYear : undefined,
  };
}

function buildIssuesByYear(issueRows) {
  const byMagazineAndYear = {};
  for (const row of issueRows) {
    const p = toPlain(row);
    if (!p) continue;
    const key = `${p.id_magazine}|${p.year}`;
    if (!byMagazineAndYear[key]) byMagazineAndYear[key] = [];
    byMagazineAndYear[key].push(toApiIssue(row));
  }
  for (const arr of Object.values(byMagazineAndYear)) {
    arr.sort((a, b) => a.issue_number - b.issue_number);
  }
  return byMagazineAndYear;
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
    if (rows.length === 0) return [];
    const ids = rows.map((r) => toPlain(r).id_magazine);
    const issueRows = await MagazineIssueDbModel.findAll({
      where: { id_magazine: ids },
      order: [
        ["id_magazine", "ASC"],
        ["year", "ASC"],
        ["issue_number", "ASC"],
      ],
    });
    const byKey = buildIssuesByYear(issueRows);
    return rows.map((r) => {
      const p = toPlain(r);
      const issuesByYear = {};
      for (const k of Object.keys(byKey)) {
        if (k.startsWith(p.id_magazine + "|")) {
          const year = k.split("|")[1];
          issuesByYear[year] = byKey[k];
        }
      }
      return toApiMagazine(r, issuesByYear);
    });
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
  const issueRows = await MagazineIssueDbModel.findAll({
    where: { id_magazine: idMagazine },
    order: [
      ["year", "ASC"],
      ["issue_number", "ASC"],
    ],
  });
  const byKey = buildIssuesByYear(issueRows);
  const p = toPlain(row);
  const issuesByYear = {};
  for (const k of Object.keys(byKey)) {
    if (k.startsWith(p.id_magazine + "|")) {
      const year = k.split("|")[1];
      issuesByYear[year] = byKey[k];
    }
  }
  return toApiMagazine(row, issuesByYear);
}

export async function createMagazine(data) {
  await ensureModels();
  const payload = {
    id_magazine: data.id_magazine,
    name: data.name,
    description: data.description ?? "",
    first_year: data.first_year ?? null,
    last_year: data.last_year ?? data.first_year ?? null,
    notes: data.notes ?? "",
    portal_name: data.portal_name ?? "",
  };
  await MagazineDbModel.create(payload);
  if (data.issues_by_year && typeof data.issues_by_year === "object") {
    await setMagazineIssues(data.id_magazine, data.issues_by_year);
  }
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
  if (body.notes !== undefined) updates.notes = String(body.notes ?? "").trim();
  if (body.first_year !== undefined) updates.first_year = body.first_year == null ? null : Number(body.first_year);
  if (body.last_year !== undefined) updates.last_year = body.last_year == null ? null : Number(body.last_year);
  if (body.portal_name !== undefined) updates.portal_name = String(body.portal_name ?? "").trim();
  updates.updated_at = new Date();
  if (Object.keys(updates).length > 0) {
    await row.update(updates);
  }
  if (body.issues_by_year !== undefined && typeof body.issues_by_year === "object") {
    await setMagazineIssues(idMagazine, body.issues_by_year);
  }
  return getMagazineById(idMagazine);
}

export async function setMagazineIssues(idMagazine, issuesByYear) {
  await MagazineIssueDbModel.destroy({ where: { id_magazine: idMagazine } });
  const toInsert = [];
  for (const [yearStr, issues] of Object.entries(issuesByYear)) {
    if (!Array.isArray(issues)) continue;
    const year = parseInt(yearStr, 10);
    if (Number.isNaN(year)) continue;
    for (const issue of issues) {
      const month = issue.forecasted_publication_month;
      toInsert.push({
        id_magazine: idMagazine,
        year,
        issue_number: issue.issue_number,
        is_special_edition: Boolean(issue.is_special_edition),
        special_topic: issue.special_topic ?? null,
        forecasted_publication_month: month >= 1 && month <= 12 ? month : null,
      });
    }
  }
  if (toInsert.length > 0) {
    await MagazineIssueDbModel.bulkCreate(toInsert);
  }
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
