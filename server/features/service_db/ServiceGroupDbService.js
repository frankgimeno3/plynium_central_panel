import { randomUUID } from "node:crypto";
import ServiceGroupDbModel from "./ServiceGroupDbModel.js";
import "../../database/models.js";

function toPlain(row) {
    return typeof row?.get === "function" ? row.get({ plain: true }) : row;
}

function toApiServiceGroup(row) {
    const p = toPlain(row);
    if (!p) return null;
    return {
        service_group_id: p.service_group_id,
        service_group_name: p.service_group_name ?? "",
        service_group_channel: p.service_group_channel ?? "",
    };
}

async function ensureModels() {
    if (!ServiceGroupDbModel.sequelize) {
        console.warn("ServiceGroupDbModel not initialized");
        return false;
    }
    return true;
}

export async function getAllServiceGroups() {
    try {
        if (!(await ensureModels())) return [];
        const rows = await ServiceGroupDbModel.findAll({
            order: [
                ["service_group_channel", "ASC"],
                ["service_group_name", "ASC"],
            ],
        });
        return rows.map((r) => toApiServiceGroup(r));
    } catch (error) {
        console.error("Error fetching service groups:", error);
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

export async function getServiceGroupById(serviceGroupId) {
    if (!(await ensureModels())) {
        throw new Error("ServiceGroupDbModel not initialized");
    }
    const row = await ServiceGroupDbModel.findByPk(serviceGroupId);
    if (!row) {
        throw new Error(`Service group with id ${serviceGroupId} not found`);
    }
    return toApiServiceGroup(row);
}

/** Lowercase snake_case, letters/digits/underscore only, max 255 (aligned with seeded rows). */
export function normalizeServiceGroupName(raw) {
    let s = String(raw ?? "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "");
    if (s.length > 255) s = s.slice(0, 255);
    return s;
}

/**
 * @param {{ service_group_name: string, service_group_channel: string }} data
 */
export async function createServiceGroup(data) {
    if (!(await ensureModels())) {
        throw new Error("ServiceGroupDbModel not initialized");
    }
    const service_group_name = normalizeServiceGroupName(data.service_group_name);
    if (!service_group_name) {
        throw new Error("service_group_name is required (use letters, numbers, underscores)");
    }
    const service_group_channel = String(data.service_group_channel ?? "")
        .trim()
        .toLowerCase();
    const row = await ServiceGroupDbModel.create({
        service_group_id: randomUUID(),
        service_group_name,
        service_group_channel,
    });
    return toApiServiceGroup(row);
}
