import crypto from "node:crypto";
import ServiceDbModel from "./ServiceDbModel.js";
import ServiceGroupDbModel from "./ServiceGroupDbModel.js";
import "../../database/models.js";

const serviceGroupInclude = {
    model: ServiceGroupDbModel,
    as: "service_group",
    attributes: ["service_group_id", "service_group_name", "service_group_channel"],
    required: true,
};

/** Maps service_groups.service_group_channel to legacy service_type values used by older UI. */
function channelToLegacyServiceType(channel) {
    const c = String(channel ?? "").toLowerCase().trim();
    if (c === "dem") return "newsletter";
    if (c === "portal") return "portal";
    if (c === "magazine") return "magazine";
    return "other";
}

/** Picks a stable default row per channel (first by service_group_name) for legacy service_type PATCH. */
async function resolveDefaultServiceGroupIdForLegacyServiceType(serviceType) {
    const t = String(serviceType ?? "").toLowerCase().trim();
    const channelMap = { newsletter: "dem", portal: "portal", magazine: "magazine", other: "dem" };
    const ch = channelMap[t] ?? "dem";
    const group = await ServiceGroupDbModel.findOne({
        where: { service_group_channel: ch },
        order: [["service_group_name", "ASC"]],
    });
    return group?.service_group_id ?? null;
}

function toApiService(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    const service_id = plain.service_id;
    const service_full_name = plain.service_full_name ?? "";
    const service_unit_price = Number(plain.service_unit_price ?? 0);
    const group = plain.service_group ?? null;
    const channel = group?.service_group_channel ?? "";
    return {
        service_id,
        service_full_name,
        service_group_id: plain.service_group_id ?? group?.service_group_id ?? null,
        service_group_name: group?.service_group_name ?? null,
        service_group_channel: channel,
        service_format: plain.service_format ?? "",
        service_description: plain.service_description ?? "",
        service_unit: plain.service_unit ?? "",
        service_unit_price,
        service_unit_specifications: plain.service_unit_specifications ?? "",
        id_service: service_id,
        name: service_full_name,
        tariff_price_eur: service_unit_price,
        service_type: channelToLegacyServiceType(channel),
    };
}

export async function getAllServices() {
    try {
        if (!ServiceDbModel.sequelize) {
            console.warn("ServiceDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await ServiceDbModel.findAll({
            order: [["service_id", "ASC"]],
            include: [serviceGroupInclude],
        });
        return rows.map((r) => toApiService(r));
    } catch (error) {
        console.error("Error fetching services from database:", error);
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

export async function getServiceById(idService) {
    const row = await ServiceDbModel.findByPk(idService, { include: [serviceGroupInclude] });
    if (!row) {
        throw new Error(`Service with id ${idService} not found`);
    }
    return toApiService(row);
}

export async function updateService(idService, patch) {
    const row = await ServiceDbModel.findByPk(idService, { include: [serviceGroupInclude] });
    if (!row) {
        throw new Error(`Service with id ${idService} not found`);
    }

    const updateData = {};

    if (patch?.service_full_name !== undefined) updateData.service_full_name = String(patch.service_full_name);
    else if (patch?.name !== undefined) updateData.service_full_name = String(patch.name);

    if (patch?.service_group_id !== undefined) {
        const id = String(patch.service_group_id).trim();
        if (id) updateData.service_group_id = id;
    } else if (patch?.service_type !== undefined) {
        const gid = await resolveDefaultServiceGroupIdForLegacyServiceType(patch.service_type);
        if (gid) updateData.service_group_id = gid;
    }

    if (patch?.service_format !== undefined) updateData.service_format = String(patch.service_format);
    if (patch?.service_description !== undefined) updateData.service_description = String(patch.service_description);
    if (patch?.service_unit !== undefined) updateData.service_unit = String(patch.service_unit);
    if (patch?.service_unit_specifications !== undefined) {
        updateData.service_unit_specifications = String(patch.service_unit_specifications);
    }

    if (patch?.service_unit_price !== undefined) {
        const v = Number(patch.service_unit_price);
        updateData.service_unit_price = Number.isNaN(v) ? 0 : v;
    } else if (patch?.tariff_price_eur !== undefined) {
        const v = Number(patch.tariff_price_eur);
        updateData.service_unit_price = Number.isNaN(v) ? 0 : v;
    }

    await row.update(updateData);
    await row.reload({ include: [serviceGroupInclude] });
    return toApiService(row);
}

/** Same stable id as migration 089_services_db_seed_by_portals_magazines.sql (md5(magazine_id || '|' || service_group_id)). */
export function magazineCatalogServiceId(magazineId, serviceGroupId) {
    const key = `${magazineId}|${String(serviceGroupId)}`;
    const hash = crypto.createHash("md5").update(key, "utf8").digest("hex");
    return `svc-mgz-${hash}`;
}

function titleFromSnakeGroupName(name) {
    return String(name || "")
        .split("_")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

function buildMagazineServiceFullName(magazineName, serviceGroupName, magazineId) {
    const label = titleFromSnakeGroupName(serviceGroupName);
    const full = `${magazineName} — ${label} — magazine ${magazineId}`;
    return full.length > 512 ? full.slice(0, 512) : full;
}

/**
 * Inserts one services_db row per service_group with channel magazine (idempotent by service_id).
 * @param {{ magazineId: string, magazineName: string }} params
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 */
export async function createServicesForNewMagazine(params, options = {}) {
    if (!ServiceDbModel.sequelize) {
        console.warn("ServiceDbModel not initialized, skipping magazine catalog services");
        return;
    }
    const magazineId = String(params.magazineId ?? "").trim();
    const magazineName = String(params.magazineName ?? "").trim() || magazineId;
    if (!magazineId) return;

    const groups = await ServiceGroupDbModel.findAll({
        where: { service_group_channel: "magazine" },
        order: [["service_group_name", "ASC"]],
        transaction: options.transaction,
    });

    for (const g of groups) {
        const gid = g.get("service_group_id");
        const service_id = magazineCatalogServiceId(magazineId, gid);
        const service_full_name = buildMagazineServiceFullName(magazineName, g.get("service_group_name"), magazineId);
        await ServiceDbModel.findOrCreate({
            where: { service_id },
            defaults: {
                service_full_name,
                service_group_id: gid,
                service_format: "",
                service_description: "",
                service_unit: "",
                service_unit_price: 0,
                service_unit_specifications: "",
            },
            transaction: options.transaction,
        });
    }
}
