import ProviderDbModel from "./ProviderDbModel.js";
import ProviderInvoiceDbModel from "./ProviderInvoiceDbModel.js";
import "../../database/models.js";

function toApiProvider(row) {
    if (!row) return null;
    return {
        id_provider: row.id_provider,
        name: row.name ?? "",
        contact_email: row.contact_email ?? "",
        contact_phone: row.contact_phone ?? "",
        address: row.address ?? "",
        tax_id: row.tax_id ?? "",
        notes: row.notes ?? ""
    };
}

function toApiProviderInvoice(row) {
    if (!row) return null;
    return {
        id: row.id,
        id_provider: row.id_provider,
        provider_name: row.provider_name ?? "",
        label: row.label ?? "",
        amount_eur: row.amount_eur != null ? Number(row.amount_eur) : 0,
        payment_date: row.payment_date
    };
}

export async function getAllProviders() {
    try {
        if (!ProviderDbModel.sequelize) {
            console.warn("ProviderDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await ProviderDbModel.findAll({
            order: [["name", "ASC"]],
        });
        return rows.map((r) => toApiProvider(r.get({ plain: true })));
    } catch (error) {
        console.error("Error fetching providers from database:", error);
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

export async function getProviderById(idProvider) {
    const row = await ProviderDbModel.findByPk(idProvider);
    if (!row) {
        throw new Error(`Provider with id ${idProvider} not found`);
    }
    return toApiProvider(row.get({ plain: true }));
}

export async function getAllProviderInvoices() {
    try {
        if (!ProviderInvoiceDbModel.sequelize) {
            console.warn("ProviderInvoiceDbModel not initialized, returning empty array");
            return [];
        }
        const rows = await ProviderInvoiceDbModel.findAll({
            order: [["payment_date", "DESC"]],
        });
        return rows.map((r) => toApiProviderInvoice(r.get({ plain: true })));
    } catch (error) {
        console.error("Error fetching provider invoices from database:", error);
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

export async function getProviderInvoiceById(idInvoice) {
    const row = await ProviderInvoiceDbModel.findByPk(idInvoice);
    if (!row) {
        throw new Error(`Provider invoice with id ${idInvoice} not found`);
    }
    return toApiProviderInvoice(row.get({ plain: true }));
}

export async function updateProviderInvoice(idInvoice, patch) {
    const row = await ProviderInvoiceDbModel.findByPk(idInvoice);
    if (!row) {
        const err = new Error(`Provider invoice with id ${idInvoice} not found`);
        err.statusCode = 404;
        throw err;
    }
    const updates = {};
    if (patch.amount_eur !== undefined && patch.amount_eur !== null) {
        updates.amount_eur = patch.amount_eur;
    }
    if (
        patch.payment_date !== undefined &&
        patch.payment_date !== null &&
        String(patch.payment_date).trim() !== ""
    ) {
        updates.payment_date = String(patch.payment_date).trim().slice(0, 10);
    }
    if (patch.label !== undefined && patch.label !== null) {
        updates.label = String(patch.label).slice(0, 512);
    }
    if (patch.id_provider !== undefined && patch.id_provider !== null) {
        const idProv = String(patch.id_provider).trim();
        if (!idProv) {
            const err = new Error("id_provider cannot be empty");
            err.statusCode = 400;
            throw err;
        }
        const provRow = await ProviderDbModel.findByPk(idProv);
        if (!provRow) {
            const err = new Error(`Provider with id ${idProv} not found`);
            err.statusCode = 400;
            throw err;
        }
        updates.id_provider = idProv;
        if (patch.provider_name === undefined) {
            const plain = provRow.get({ plain: true });
            updates.provider_name = plain.name ?? "";
        }
    }
    if (patch.provider_name !== undefined && patch.provider_name !== null) {
        updates.provider_name = String(patch.provider_name).slice(0, 512);
    }
    if (Object.keys(updates).length === 0) {
        return toApiProviderInvoice(row.get({ plain: true }));
    }
    await row.update(updates);
    await row.reload();
    return toApiProviderInvoice(row.get({ plain: true }));
}

export async function getProviderInvoicesByProvider(idProvider) {
    if (!ProviderInvoiceDbModel.sequelize) {
        console.warn("ProviderInvoiceDbModel not initialized, returning empty array");
        return [];
    }
    const rows = await ProviderInvoiceDbModel.findAll({
        where: { id_provider: idProvider },
        order: [["payment_date", "DESC"]],
    });
    return rows.map((r) => toApiProviderInvoice(r.get({ plain: true })));
}

