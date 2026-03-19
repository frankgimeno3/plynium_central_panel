import ProjectDbModel from "./ProjectDbModel.js";
import "../../database/models.js";

function toApiProject(row) {
  if (!row) return null;
  return {
    id_project: row.id_project,
    id_contract: row.id_contract ?? "",
    title: row.title ?? "",
    status: row.status ?? "",
    service: row.service ?? "",
    publication_date: row.publication_date ?? "",
    publication_id: row.publication_id ?? "",
    pm_events_array: Array.isArray(row.pm_events_array) ? row.pm_events_array : [],
  };
}

export async function getAllProjects() {
  try {
    if (!ProjectDbModel.sequelize) {
      console.warn("ProjectDbModel not initialized, returning empty array");
      return [];
    }
    const rows = await ProjectDbModel.findAll({
      order: [["publication_date", "DESC"]],
    });
    return rows.map((r) => toApiProject(r.get({ plain: true })));
  } catch (error) {
    console.error("Error fetching projects from database:", error);
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

export async function getProjectById(idProject) {
  const row = await ProjectDbModel.findByPk(idProject);
  if (!row) throw new Error(`Project with id ${idProject} not found`);
  return toApiProject(row.get({ plain: true }));
}

export async function getProjectsByContract(idContract) {
  if (!ProjectDbModel.sequelize) {
    console.warn("ProjectDbModel not initialized, returning empty array");
    return [];
  }
  const rows = await ProjectDbModel.findAll({
    where: { id_contract: idContract },
    order: [["publication_date", "DESC"]],
  });
  return rows.map((r) => toApiProject(r.get({ plain: true })));
}

