import ServiceDbModel from "./ServiceDbModel.js";
import "../../database/models.js";

function toApiService(row) {
    if (!row) return null;
    const plain = typeof row.get === "function" ? row.get({ plain: true }) : row;
    const out = {
        id_service: plain.id_service,
        name: plain.name ?? "",
        service_type: plain.service_type ?? "",
        display_name: plain.display_name ?? "",
        description: plain.description ?? "",
        service_description: plain.service_description ?? "",
        tariff_price_eur: Number(plain.tariff_price_eur ?? 0),
        unit: plain.unit ?? "",
        delivery_days: Number(plain.delivery_days ?? 0),
    };
    if (plain.publication_date != null) out.publication_date = plain.publication_date;
    return out;
}

export async function getAllServices() {
    try {
        if (!ServiceDbModel.sequelize) {
            console.warn("ServiceDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await ServiceDbModel.findAll({
            order: [["id_service", "ASC"]],
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

    if (patch?.name !== undefined) updateData.name = String(patch.name);
    if (patch?.service_type !== undefined) updateData.service_type = String(patch.service_type);
    if (patch?.service_description !== undefined) updateData.service_description = String(patch.service_description);

    if (patch?.tariff_price_eur !== undefined) {
        const v = Number(patch.tariff_price_eur);
        updateData.tariff_price_eur = Number.isNaN(v) ? 0 : v;
    }

    if (patch?.publication_date !== undefined) {
        // Sequelize accepts either a YYYY-MM-DD string (DATEONLY) or null.
        updateData.publication_date = patch.publication_date ? String(patch.publication_date) : null;
    }

    // Optional fields used by the DB schema (kept for future extensibility).
    if (patch?.display_name !== undefined) updateData.display_name = String(patch.display_name);
    if (patch?.description !== undefined) updateData.description = String(patch.description);
    if (patch?.unit !== undefined) updateData.unit = String(patch.unit);
    if (patch?.delivery_days !== undefined) updateData.delivery_days = Number(patch.delivery_days ?? 0);

    await row.update(updateData);
    return toApiService(row);
}
