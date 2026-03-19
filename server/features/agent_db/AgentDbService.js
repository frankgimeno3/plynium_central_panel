import AgentDbModel from "./AgentDbModel.js";
import "../../database/models.js";

function toApiAgent(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    return {
        id_agent: plain.id_agent,
        name: plain.name ?? "",
        email: plain.email ?? "",
        phone: plain.phone ?? "", // optional; column may be added later
    };
}

export async function getAllAgents() {
    try {
        if (!AgentDbModel.sequelize) {
            console.warn("AgentDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await AgentDbModel.findAll({
            order: [["name", "ASC"]],
        });
        return rows.map((r) => toApiAgent(r));
    } catch (error) {
        console.error("Error fetching agents from database:", error);
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

export async function getAgentById(idAgent) {
    const row = await AgentDbModel.findByPk(idAgent);
    if (!row) {
        throw new Error(`Agent with id ${idAgent} not found`);
    }
    return toApiAgent(row);
}
