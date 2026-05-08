import crypto from "node:crypto";
import { QueryTypes } from "sequelize";
import ServiceDbModel from "./ServiceDbModel.js";
import ServiceGroupDbModel from "./ServiceGroupDbModel.js";
import "../../database/models.js";

const serviceGroupInclude = {
    model: ServiceGroupDbModel,
    as: "service_group",
    attributes: ["service_group_id", "service_group_name", "service_group_channel", "service_specifications", "service_base_description"],
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
    const shown_name = plain.shown_name ?? "";
    const service_unit_price = Number(plain.service_unit_price ?? 0);
    const group = plain.service_group ?? null;
    const channel = group?.service_group_channel ?? "";
    return {
        service_id,
        service_full_name,
        shown_name,
        service_portal: plain.service_portal != null ? Number(plain.service_portal) : null,
        service_group_id: plain.service_group_id ?? group?.service_group_id ?? null,
        service_group_name: group?.service_group_name ?? null,
        service_group_channel: channel,
        service_group_specifications: group?.service_specifications ?? "",
        service_group_base_description: group?.service_base_description ?? "",
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

/**
 * Next catalog service id: srv_{year}_{nnnnn} — 5-digit serial per calendar year (server-local year).
 * @param {number|null|undefined} yearInput Calendar year override (2000–2100), else current year.
 */
export async function mintNextCatalogServiceId(yearInput) {
    if (!ServiceDbModel.sequelize) {
        throw new Error("ServiceDbModel not initialized");
    }
    const y =
        yearInput != null && Number.isFinite(Number(yearInput)) && Number(yearInput) >= 2000 && Number(yearInput) <= 2100
            ? Math.trunc(Number(yearInput))
            : new Date().getFullYear();
    const yr = String(y);
    const sequelize = ServiceDbModel.sequelize;

    const pattern = `^srv_${yr.replace(/[^\d]/g, "")}_[0-9]{5}$`;
    const [rows] = await sequelize.query(
        `
        SELECT COALESCE(MAX(CAST(split_part(service_id, '_', 3) AS INTEGER)), 0) AS max_seq
        FROM services_db
        WHERE service_id ~ :pattern
        `,
        { replacements: { pattern } }
    );
    const mx = rows?.[0]?.max_seq ?? 0;
    const next = Number(mx) + 1;
    if (!Number.isFinite(next) || next < 1 || next > 99999) {
        throw new Error("Service id sequence exhausted for this year");
    }
    const suffix = String(next).padStart(5, "0");
    return `srv_${yr}_${suffix}`;
}

function isSequelizeUniqueConstraintError(error) {
    const name = error?.name ?? "";
    return name === "SequelizeUniqueConstraintError" || String(error?.message ?? "").toLowerCase().includes("duplicate");
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

function tariffFromGroupRow(groupRow) {
    const n = Number(groupRow?.get?.("tariff_price_eur"));
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Creates a services_db row. If neither tariff_price_eur nor service_unit_price is present in data,
 * uses service_groups.tariff_price_eur for that group. If the client sends either field (including 0),
 * that value wins.
 *
 * @param {object} data
 * @param {string} [data.service_id]
 * @param {string} [data.id_service]
 * @param {string} [data.service_full_name]
 * @param {string} [data.name]
 * @param {string} data.service_group_id
 * @param {number} [data.service_portal]
 * @param {string} [data.service_format]
 * @param {string} [data.service_description]
 * @param {string} [data.service_unit]
 * @param {string} [data.service_unit_specifications]
 * @param {number} [data.service_unit_price]
 * @param {number} [data.tariff_price_eur]
 */
export async function createService(data) {
    if (!ServiceDbModel.sequelize) {
        throw new Error("ServiceDbModel not initialized");
    }
    let service_id = String(data.service_id ?? data.id_service ?? "").trim();
    const auto =
        service_id === "" ||
        service_id.toLowerCase() === "auto" ||
        data.mint_catalog_service_id === true ||
        data.use_auto_service_id === true;
    if (!auto && !service_id) {
        throw new Error("service_id is required");
    }
    const catalogYear = data.service_id_year ?? data.catalog_year ?? null;
    const service_full_name = String(data.service_full_name ?? data.name ?? "").trim();
    if (!service_full_name) {
        throw new Error("name is required");
    }
    const service_group_id = String(data.service_group_id ?? "").trim();
    if (!service_group_id) {
        throw new Error("service_group_id is required");
    }

    const group = await ServiceGroupDbModel.findByPk(service_group_id);
    if (!group) {
        throw new Error("Service group not found");
    }

    let service_unit_price;
    if (data.tariff_price_eur !== undefined && data.tariff_price_eur !== null) {
        const v = Number(data.tariff_price_eur);
        service_unit_price = Number.isFinite(v) && v >= 0 ? v : 0;
    } else if (data.service_unit_price !== undefined && data.service_unit_price !== null) {
        const v = Number(data.service_unit_price);
        service_unit_price = Number.isFinite(v) && v >= 0 ? v : 0;
    } else {
        service_unit_price = tariffFromGroupRow(group);
    }

    const service_portal =
        data.service_portal != null && !Number.isNaN(Number(data.service_portal)) ? Number(data.service_portal) : 0;

    const maxAttempts = auto ? 6 : 1;
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let sid = auto ? await mintNextCatalogServiceId(catalogYear) : service_id;
        if (!auto) {
            const dup = await ServiceDbModel.findByPk(sid);
            if (dup) {
                throw new Error(`Service with id ${sid} already exists`);
            }
        }
        try {
            await ServiceDbModel.create({
                service_id: sid,
                service_full_name,
                service_group_id,
                service_portal,
                service_format: String(data.service_format ?? ""),
                service_description: String(data.service_description ?? ""),
                service_unit: String(data.service_unit ?? ""),
                service_unit_price,
                service_unit_specifications: String(data.service_unit_specifications ?? ""),
            });
            return getServiceById(sid);
        } catch (e) {
            lastErr = e;
            if (!auto || !isSequelizeUniqueConstraintError(e)) {
                throw e;
            }
        }
    }
    throw lastErr ?? new Error("Could not allocate a unique service id");
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

    let servicePortal = 0;
    if (ServiceDbModel.sequelize) {
        const portalRows = await ServiceDbModel.sequelize.query(
            `SELECT mp.portal_id AS portal_id
             FROM public.magazine_portals mp
             WHERE mp.magazine_id = :magazineId
             ORDER BY mp.portal_id ASC
             LIMIT 1`,
            {
                replacements: { magazineId },
                type: QueryTypes.SELECT,
                transaction: options.transaction,
            }
        );
        const pid = portalRows?.[0]?.portal_id;
        if (pid != null && !Number.isNaN(Number(pid))) {
            servicePortal = Number(pid);
        }
    }

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
                service_portal: servicePortal,
                service_format: "",
                service_description: "",
                service_unit: "",
                service_unit_price: tariffFromGroupRow(g),
                service_unit_specifications: "",
            },
            transaction: options.transaction,
        });
    }
}
