import ServiceDbModel from "./ServiceDbModel.js";
import "../../database/models.js";

/** Maps canonical service_channel to legacy service_type values used by older UI. */
function channelToLegacyServiceType(channel) {
    const c = String(channel ?? "").toLowerCase().trim();
    if (c === "dem") return "newsletter";
    if (c === "portal") return "portal";
    if (c === "magazine") return "magazine";
    return "other";
}

function toApiService(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    const service_id = plain.service_id;
    const service_full_name = plain.service_full_name ?? "";
    const service_unit_price = Number(plain.service_unit_price ?? 0);
    const service_channel = plain.service_channel ?? "";
    return {
        service_id,
        service_full_name,
        service_channel,
        service_product: plain.service_product ?? "",
        service_format: plain.service_format ?? "",
        service_description: plain.service_description ?? "",
        service_unit: plain.service_unit ?? "",
        service_unit_price,
        service_unit_specifications: plain.service_unit_specifications ?? "",
        // Backward-compatible aliases for logged UI still using legacy field names
        id_service: service_id,
        name: service_full_name,
        tariff_price_eur: service_unit_price,
        service_type: channelToLegacyServiceType(service_channel)
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
    const row = await ServiceDbModel.findByPk(idService);
    if (!row) {
        throw new Error(`Service with id ${idService} not found`);
    }
    return toApiService(row);
}

export async function updateService(idService, patch) {
    const row = await ServiceDbModel.findByPk(idService);
    if (!row) {
        throw new Error(`Service with id ${idService} not found`);
    }

    // Only pass fields we actually want to update.
    const updateData = {};

    if (patch?.service_full_name !== undefined) updateData.service_full_name = String(patch.service_full_name);
    else if (patch?.name !== undefined) updateData.service_full_name = String(patch.name);

    if (patch?.service_channel !== undefined) updateData.service_channel = String(patch.service_channel);
    else if (patch?.service_type !== undefined) {
        const t = String(patch.service_type).toLowerCase().trim();
        const legacy = { newsletter: "dem", portal: "portal", magazine: "magazine", other: "dem" };
        updateData.service_channel = legacy[t] ?? "dem";
    }

    if (patch?.service_product !== undefined) updateData.service_product = String(patch.service_product);
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
    return toApiService(row);
}
