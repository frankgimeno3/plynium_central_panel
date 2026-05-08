import { randomUUID } from "node:crypto";
import ServiceGroupDbModel from "./ServiceGroupDbModel.js";
import "../../database/models.js";

function toPlain(row) {
    return typeof row?.get === "function" ? row.get({ plain: true }) : row;
}

function tariffPriceToNumber(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

function toApiServiceGroup(row) {
    const p = toPlain(row);
    if (!p) return null;
    return {
        service_group_id: p.service_group_id,
        service_group_name: p.service_group_name ?? "",
        shown_name: p.shown_name ?? "",
        service_group_channel: p.service_group_channel ?? "",
        tariff_price_eur: tariffPriceToNumber(p.tariff_price_eur),
        service_specifications: p.service_specifications ?? "",
        service_base_description: p.service_base_description ?? "",
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
    // Keep the user's input as-is (except trimming and max length).
    // NOTE: Historical seed data uses snake_case, but the app now allows free-form names.
    let s = String(raw ?? "").trim();
    if (s.length > 255) s = s.slice(0, 255);
    return s;
}

function parseTariffPriceEur(raw) {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return 0;
    return n;
}

function computeShownNameFromGroupName(service_group_name) {
    // Default shown_name to the same value as the group name.
    return String(service_group_name ?? "").trim();
}

/** Same visible name as another row (case-insensitive, after trim). */
export const SERVICE_GROUP_NAME_EXISTS_MESSAGE = "A service group with this name already exists";

async function findServiceGroupByNameCaseInsensitive(normalizedName) {
    const sequelize = ServiceGroupDbModel.sequelize;
    if (!sequelize || !String(normalizedName ?? "").trim()) {
        return null;
    }
    const lower = String(normalizedName).toLowerCase();
    return ServiceGroupDbModel.findOne({
        where: sequelize.where(
            sequelize.fn("LOWER", sequelize.col("service_group_name")),
            lower
        ),
    });
}

async function assertServiceGroupNameUnique(service_group_name, exceptServiceGroupId = null) {
    const row = await findServiceGroupByNameCaseInsensitive(service_group_name);
    if (!row) return;
    const id = String(row.get("service_group_id") ?? "");
    if (exceptServiceGroupId != null && id === String(exceptServiceGroupId)) {
        return;
    }
    throw new Error(SERVICE_GROUP_NAME_EXISTS_MESSAGE);
}

/**
 * @param {{ service_group_name: string, service_group_channel: string, tariff_price_eur?: number|string, service_specifications?: string }} data
 */
export async function createServiceGroup(data) {
    if (!(await ensureModels())) {
        throw new Error("ServiceGroupDbModel not initialized");
    }
    const service_group_name = normalizeServiceGroupName(data.service_group_name);
    if (!service_group_name) {
        throw new Error("service_group_name is required");
    }
    const service_group_channel = String(data.service_group_channel ?? "")
        .trim()
        .toLowerCase();
    const tariff_price_eur = parseTariffPriceEur(data.tariff_price_eur);
    const shown_name = computeShownNameFromGroupName(service_group_name);
    const service_specifications = String(data.service_specifications ?? "").trim();
    const service_base_description = String(data.service_base_description ?? "").trim();
    await assertServiceGroupNameUnique(service_group_name);
    const row = await ServiceGroupDbModel.create({
        service_group_id: randomUUID(),
        service_group_name,
        shown_name,
        service_group_channel,
        tariff_price_eur,
        service_specifications,
        service_base_description,
    });
    return toApiServiceGroup(row);
}

/**
 * @param {string} serviceGroupId
 * @param {{ service_group_name?: string, service_group_channel?: string, tariff_price_eur?: number|string, service_specifications?: string, service_base_description?: string }} data
 */
export async function updateServiceGroup(serviceGroupId, data) {
    if (!(await ensureModels())) {
        throw new Error("ServiceGroupDbModel not initialized");
    }
    const row = await ServiceGroupDbModel.findByPk(serviceGroupId);
    if (!row) {
        throw new Error(`Service group with id ${serviceGroupId} not found`);
    }
    const currentName = String(row.get("service_group_name") ?? "");
    const currentChannel = String(row.get("service_group_channel") ?? "");
    const service_group_name =
        data.service_group_name !== undefined ? normalizeServiceGroupName(data.service_group_name) : currentName;
    if (!String(service_group_name ?? "").trim()) throw new Error("service_group_name is required");
    const service_group_channel =
        data.service_group_channel !== undefined ? String(data.service_group_channel ?? "").trim().toLowerCase() : currentChannel;
    if (!String(service_group_channel ?? "").trim()) throw new Error("service_group_channel is required");
    const tariff_price_eur =
        data.tariff_price_eur !== undefined ? parseTariffPriceEur(data.tariff_price_eur) : tariffPriceToNumber(row.get("tariff_price_eur"));
    const shown_name = computeShownNameFromGroupName(service_group_name);
    const service_specifications =
        data.service_specifications !== undefined ? String(data.service_specifications ?? "").trim() : String(row.get("service_specifications") ?? "");
    const service_base_description =
        data.service_base_description !== undefined
            ? String(data.service_base_description ?? "").trim()
            : String(row.get("service_base_description") ?? "");
    await assertServiceGroupNameUnique(service_group_name, serviceGroupId);
    await row.update({
        service_group_name,
        shown_name,
        service_group_channel,
        tariff_price_eur,
        service_specifications,
        service_base_description,
    });
    await row.reload();
    return toApiServiceGroup(row);
}
