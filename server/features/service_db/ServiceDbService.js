import crypto from "node:crypto";
import { QueryTypes } from "sequelize";
import ServiceDbModel from "./ServiceDbModel.js";
import "../../database/models.js";

const parentServiceInclude = {
    model: ServiceDbModel,
    as: "parent_service",
    attributes: [
        "service_id",
        "service_full_name",
        "shown_name",
        "service_channel",
        "specifity",
        "service_description",
        "service_unit_specifications",
        "service_unit_price",
    ],
    required: false,
};

const relatedServicesInclude = {
    model: ServiceDbModel,
    as: "related_services",
    attributes: [
        "service_id",
        "service_full_name",
        "shown_name",
        "service_channel",
        "specifity",
        "related_to_other_services",
        "service_unit_price",
    ],
    required: false,
};

/** Maps service_channel to legacy service_type values used by older UI. */
function channelToLegacyServiceType(channel) {
    const c = String(channel ?? "").toLowerCase().trim();
    if (c === "dem") return "newsletter";
    if (c === "portal") return "portal";
    if (c === "magazine") return "magazine";
    return "other";
}

/** Picks a stable default general service per channel for legacy service_type PATCH. */
async function resolveDefaultGeneralServiceIdForLegacyServiceType(serviceType) {
    const t = String(serviceType ?? "").toLowerCase().trim();
    const channelMap = { newsletter: "dem", portal: "portal", magazine: "magazine", other: "dem" };
    const ch = channelMap[t] ?? "dem";
    const row = await ServiceDbModel.findOne({
        where: { service_channel: ch, specifity: "general" },
        order: [["service_full_name", "ASC"]],
    });
    return row?.service_id ?? null;
}

function normalizeSpecifity(value) {
    const s = String(value ?? "").trim().toLowerCase();
    if (s === "specific-related" || s === "specific_related") return "specific-related";
    return "general";
}

function toRelatedServiceSummary(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    return {
        service_id: plain.service_id,
        service_full_name: plain.service_full_name ?? "",
        shown_name: plain.shown_name ?? "",
        service_channel: plain.service_channel ?? "",
        specifity: normalizeSpecifity(plain.specifity),
        related_to_other_services: plain.related_to_other_services ?? null,
        service_unit_price: Number(plain.service_unit_price ?? 0),
        id_service: plain.service_id,
        name: plain.service_full_name ?? "",
        tariff_price_eur: Number(plain.service_unit_price ?? 0),
        service_type: channelToLegacyServiceType(plain.service_channel),
    };
}

function toApiService(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    const service_id = plain.service_id;
    const service_full_name = plain.service_full_name ?? "";
    const shown_name = plain.shown_name ?? "";
    const service_unit_price = Number(plain.service_unit_price ?? 0);
    const channel = plain.service_channel ?? "";
    const specifity = normalizeSpecifity(plain.specifity);
    const parent = plain.parent_service ?? null;
    const related = Array.isArray(plain.related_services) ? plain.related_services : [];

    return {
        service_id,
        service_full_name,
        shown_name,
        service_channel: channel,
        specifity,
        related_to_other_services: plain.related_to_other_services ?? null,
        service_portal: plain.service_portal != null ? Number(plain.service_portal) : null,
        service_format: plain.service_format ?? "",
        service_description: plain.service_description ?? "",
        service_unit: plain.service_unit ?? "",
        service_unit_price,
        service_unit_specifications: plain.service_unit_specifications ?? "",
        parent_service: parent ? toRelatedServiceSummary(parent) : null,
        related_services: related.map((r) => toRelatedServiceSummary(r)).filter(Boolean),
        // Legacy aliases
        service_group_id: plain.related_to_other_services ?? null,
        service_group_name: parent?.service_full_name ?? null,
        service_group_channel: parent?.service_channel ?? channel,
        service_group_specifications: parent?.service_unit_specifications ?? plain.service_unit_specifications ?? "",
        service_group_base_description: parent?.service_description ?? plain.service_description ?? "",
        id_service: service_id,
        name: service_full_name,
        tariff_price_eur: service_unit_price,
        service_type: channelToLegacyServiceType(channel),
    };
}

function serviceListOrder() {
    return [
        ["specifity", "ASC"],
        ["service_full_name", "ASC"],
        ["service_id", "ASC"],
    ];
}

export async function getAllServices(filters = {}) {
    try {
        if (!ServiceDbModel.sequelize) {
            console.warn("ServiceDbModel not initialized, returning empty array");
            return [];
        }
        const where = {};
        if (filters.specifity) {
            where.specifity = normalizeSpecifity(filters.specifity);
        }
        if (filters.service_channel) {
            where.service_channel = String(filters.service_channel).trim().toLowerCase();
        }
        if (filters.general_only === true) {
            where.specifity = "general";
        }

        const rows = await ServiceDbModel.findAll({
            where,
            order: serviceListOrder(),
            include: [parentServiceInclude],
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
    const row = await ServiceDbModel.findByPk(idService, {
        include: [parentServiceInclude, relatedServicesInclude],
    });
    if (!row) {
        throw new Error(`Service with id ${idService} not found`);
    }
    return toApiService(row);
}

export async function updateService(idService, patch) {
    const row = await ServiceDbModel.findByPk(idService, { include: [parentServiceInclude, relatedServicesInclude] });
    if (!row) {
        throw new Error(`Service with id ${idService} not found`);
    }

    const updateData = {};

    if (patch?.service_full_name !== undefined) updateData.service_full_name = String(patch.service_full_name);
    else if (patch?.name !== undefined) updateData.service_full_name = String(patch.name);

    if (patch?.shown_name !== undefined) updateData.shown_name = String(patch.shown_name);

    if (patch?.related_to_other_services !== undefined) {
        const id = String(patch.related_to_other_services ?? "").trim();
        updateData.related_to_other_services = id || null;
        if (id) updateData.specifity = "specific-related";
    } else if (patch?.service_group_id !== undefined) {
        const id = String(patch.service_group_id).trim();
        updateData.related_to_other_services = id || null;
        if (id) updateData.specifity = "specific-related";
    }

    if (patch?.service_channel !== undefined) {
        updateData.service_channel = String(patch.service_channel).trim().toLowerCase();
    } else if (patch?.service_type !== undefined) {
        const t = String(patch.service_type ?? "").toLowerCase().trim();
        const channelMap = { newsletter: "dem", portal: "portal", magazine: "magazine", other: "dem" };
        updateData.service_channel = channelMap[t] ?? "dem";
        if (normalizeSpecifity(row.get("specifity")) === "specific-related") {
            const gid = await resolveDefaultGeneralServiceIdForLegacyServiceType(patch.service_type);
            if (gid) updateData.related_to_other_services = gid;
        }
    }

    if (patch?.specifity !== undefined) {
        updateData.specifity = normalizeSpecifity(patch.specifity);
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
    await row.reload({ include: [parentServiceInclude, relatedServicesInclude] });
    return toApiService(row);
}

function tariffFromServiceRow(serviceRow) {
    const n = Number(serviceRow?.get?.("service_unit_price") ?? serviceRow?.service_unit_price);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Creates a services_db row.
 *
 * @param {object} data
 * @param {string} [data.service_id]
 * @param {string} [data.id_service]
 * @param {string} [data.service_full_name]
 * @param {string} [data.name]
 * @param {string} [data.related_to_other_services]
 * @param {string} [data.service_group_id] legacy alias
 * @param {string} [data.specifity] general | specific-related
 * @param {string} [data.service_channel]
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

    const relatedId = String(data.related_to_other_services ?? data.service_group_id ?? "").trim();
    const specifity = relatedId ? "specific-related" : normalizeSpecifity(data.specifity ?? "general");

    let parent = null;
    if (relatedId) {
        parent = await ServiceDbModel.findByPk(relatedId);
        if (!parent) {
            throw new Error("Parent service not found");
        }
        if (normalizeSpecifity(parent.get("specifity")) !== "general") {
            throw new Error("Parent service must be a general service");
        }
    }

    let service_channel = String(data.service_channel ?? "").trim().toLowerCase();
    if (!service_channel && parent) {
        service_channel = String(parent.get("service_channel") ?? "").trim().toLowerCase();
    }
    if (!service_channel && data.service_type) {
        const channelMap = { newsletter: "dem", portal: "portal", magazine: "magazine", other: "dem" };
        service_channel = channelMap[String(data.service_type).toLowerCase()] ?? "dem";
    }
    if (!service_channel && specifity === "general") {
        throw new Error("service_channel is required for general services");
    }

    let service_unit_price;
    if (data.tariff_price_eur !== undefined && data.tariff_price_eur !== null) {
        const v = Number(data.tariff_price_eur);
        service_unit_price = Number.isFinite(v) && v >= 0 ? v : 0;
    } else if (data.service_unit_price !== undefined && data.service_unit_price !== null) {
        const v = Number(data.service_unit_price);
        service_unit_price = Number.isFinite(v) && v >= 0 ? v : 0;
    } else if (parent) {
        service_unit_price = tariffFromServiceRow(parent);
    } else {
        service_unit_price = 0;
    }

    const service_description =
        data.service_description !== undefined
            ? String(data.service_description)
            : parent
              ? String(parent.get("service_description") ?? "")
              : "";

    const service_unit_specifications =
        data.service_unit_specifications !== undefined
            ? String(data.service_unit_specifications)
            : parent
              ? String(parent.get("service_unit_specifications") ?? "")
              : "";

    const service_portal =
        data.service_portal != null && !Number.isNaN(Number(data.service_portal)) ? Number(data.service_portal) : 0;

    const maxAttempts = auto ? 6 : 1;
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const sid = auto ? await mintNextCatalogServiceId(catalogYear) : service_id;
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
                shown_name: String(data.shown_name ?? service_full_name).trim(),
                service_channel,
                specifity,
                related_to_other_services: relatedId || null,
                service_portal,
                service_format: String(data.service_format ?? ""),
                service_description,
                service_unit: String(data.service_unit ?? ""),
                service_unit_price,
                service_unit_specifications,
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

/** Same stable id as migration 089 (md5(magazine_id || '|' || general_service_id)). */
export function magazineCatalogServiceId(magazineId, generalServiceId) {
    const key = `${magazineId}|${String(generalServiceId)}`;
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

function buildMagazineServiceFullName(magazineName, generalServiceName, magazineId) {
    const label = titleFromSnakeGroupName(generalServiceName);
    const full = `${magazineName} — ${label} — magazine ${magazineId}`;
    return full.length > 512 ? full.slice(0, 512) : full;
}

/**
 * Inserts one services_db row per general magazine service (idempotent by service_id).
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

    const generalServices = await ServiceDbModel.findAll({
        where: { service_channel: "magazine", specifity: "general" },
        order: [["service_full_name", "ASC"]],
        transaction: options.transaction,
    });

    for (const g of generalServices) {
        const gid = g.get("service_id");
        const service_id = magazineCatalogServiceId(magazineId, gid);
        const service_full_name = buildMagazineServiceFullName(magazineName, g.get("service_full_name"), magazineId);
        await ServiceDbModel.findOrCreate({
            where: { service_id },
            defaults: {
                service_full_name,
                service_channel: "magazine",
                specifity: "specific-related",
                related_to_other_services: gid,
                service_portal: servicePortal,
                service_format: "",
                service_description: String(g.get("service_description") ?? ""),
                service_unit: "",
                service_unit_price: tariffFromServiceRow(g),
                service_unit_specifications: String(g.get("service_unit_specifications") ?? ""),
                shown_name: String(g.get("shown_name") ?? service_full_name),
            },
            transaction: options.transaction,
        });
    }
}
