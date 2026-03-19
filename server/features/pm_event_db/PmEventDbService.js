import PmEventDbModel from "./PmEventDbModel.js";
import "../../database/models.js";

function dateToString(d) {
  if (!d) return "";
  if (typeof d === "string") return d;
  if (d instanceof Date) return d.toISOString().slice(0, 10);
  return String(d);
}

function toApiEvent(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : row;
  return {
    id_event: r.id_event ?? "",
    id_project: r.id_project ?? "",
    id_customer: r.id_customer ?? "",
    event_type: r.event_type ?? "",
    date: dateToString(r.date),
    event_description: r.event_description ?? "",
    event_state: r.event_state ?? "pending",
  };
}

export async function getAllPmEvents() {
  try {
    if (!PmEventDbModel.sequelize) {
      console.warn("PmEventDbModel not initialized, returning empty array");
      return [];
    }
    const rows = await PmEventDbModel.findAll({
      order: [["date", "ASC"]],
    });
    return rows.map((r) => toApiEvent(r));
  } catch (error) {
    console.error("Error fetching pm_events from database:", error);
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

export async function getPmEventById(idEvent) {
  const row = await PmEventDbModel.findByPk(idEvent);
  if (!row) throw new Error(`PmEvent with id ${idEvent} not found`);
  return toApiEvent(row);
}

export async function getPmEventsByProjectId(idProject) {
  try {
    if (!PmEventDbModel.sequelize) return [];
    const rows = await PmEventDbModel.findAll({
      where: { id_project: idProject },
      order: [["date", "ASC"]],
    });
    return rows.map((r) => toApiEvent(r));
  } catch (error) {
    console.error("Error fetching pm_events by project:", error);
    if (
      error.message?.includes("relation") && error.message?.includes("does not exist") ||
      error.message?.includes("not initialized")
    ) {
      return [];
    }
    throw error;
  }
}

export async function getPmEventsByCustomerId(idCustomer) {
  try {
    if (!PmEventDbModel.sequelize) return [];
    const rows = await PmEventDbModel.findAll({
      where: { id_customer: idCustomer },
      order: [["date", "ASC"]],
    });
    return rows.map((r) => toApiEvent(r));
  } catch (error) {
    console.error("Error fetching pm_events by customer:", error);
    if (
      error.message?.includes("relation") && error.message?.includes("does not exist") ||
      error.message?.includes("not initialized")
    ) {
      return [];
    }
    throw error;
  }
}
