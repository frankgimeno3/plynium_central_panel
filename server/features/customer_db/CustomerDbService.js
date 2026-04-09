import CustomerDbModel from "./CustomerDbModel.js";
import "../../database/models.js";

function toApiCustomer(row) {
    if (!row) return null;
    return {
        id_customer: row.id_customer,
        name: row.name ?? "",
        cif: row.cif ?? "",
        country: row.country ?? "",
        address: row.address ?? "",
        phone: row.phone ?? "",
        email: row.email ?? "",
        website: row.website ?? "",
        industry: row.industry ?? "",
        owner: row.owner ?? "",
        status: row.status ?? "active",
        tags: Array.isArray(row.tags) ? row.tags : [],
        related_accounts: Array.isArray(row.related_accounts) ? row.related_accounts : [],
        customer_company_id_array: Array.isArray(row.customer_company_id_array) ? row.customer_company_id_array : [],
        customer_product_id_array: Array.isArray(row.customer_product_id_array) ? row.customer_product_id_array : [],
    };
}

/**
 * Fetches all customers from the customers_db table (RDS).
 * Throws if the database is not configured or connection fails, so the UI can show an error instead of "no results".
 */
export async function getAllCustomers() {
    if (!CustomerDbModel.sequelize) {
        const msg = "Database not configured. Set DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT in .env (see .env.example). Customers (customers_db) could not be loaded.";
        console.error("[CustomerDbService]", msg);
        throw new Error(msg);
    }
    try {
        const rows = await CustomerDbModel.findAll({
            order: [["name", "ASC"]],
        });
        return rows.map((r) => toApiCustomer(r.get({ plain: true })));
    } catch (error) {
        console.error("Error fetching customers from database (customers_db):", error?.message || error);
        const isConnectionOrMissingTable =
            error.name === "SequelizeConnectionError" ||
            error.name === "SequelizeConnectionRefusedError" ||
            error.message?.includes("ETIMEDOUT") ||
            error.message?.includes("ECONNREFUSED") ||
            (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
            error.message?.includes("not initialized") ||
            error.message?.includes("Model not found");
        if (isConnectionOrMissingTable) {
            const msg = "Could not load customers from RDS (customers_db). Check database connection and that the table exists (run migrations).";
            throw new Error(msg);
        }
        throw error;
    }
}

export async function getCustomerById(idCustomer) {
    const row = await CustomerDbModel.findByPk(idCustomer);
    if (!row) {
        throw new Error(`Customer with id ${idCustomer} not found`);
    }
    return toApiCustomer(row.get({ plain: true }));
}

export async function createCustomer(data) {
    if (!CustomerDbModel.sequelize) {
        throw new Error("CustomerDbModel not initialized");
    }
    const payload = {
        id_customer: data.id_customer,
        name: data.name ?? "",
        cif: data.cif ?? "",
        country: data.country ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        website: data.website ?? "",
        industry: data.industry ?? "",
        owner: data.owner ?? "",
        status: data.status ?? "active",
        tags: Array.isArray(data.tags) ? data.tags : [],
        related_accounts: Array.isArray(data.related_accounts) ? data.related_accounts : [],
        customer_company_id_array: Array.isArray(data.customer_company_id_array) ? data.customer_company_id_array : [],
        customer_product_id_array: Array.isArray(data.customer_product_id_array) ? data.customer_product_id_array : [],
    };
    const row = await CustomerDbModel.create(payload);
    return toApiCustomer(row.get({ plain: true }));
}

export async function updateCustomer(idCustomer, data) {
    const row = await CustomerDbModel.findByPk(idCustomer);
    if (!row) {
        throw new Error(`Customer with id ${idCustomer} not found`);
    }
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.cif !== undefined) updates.cif = data.cif;
    if (data.country !== undefined) updates.country = data.country;
    if (data.address !== undefined) updates.address = data.address;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.website !== undefined) updates.website = data.website;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.owner !== undefined) updates.owner = data.owner;
    if (data.status !== undefined) updates.status = data.status;
    if (data.tags !== undefined) updates.tags = Array.isArray(data.tags) ? data.tags : [];
    if (data.related_accounts !== undefined) updates.related_accounts = Array.isArray(data.related_accounts) ? data.related_accounts : [];
    if (data.customer_company_id_array !== undefined) {
        updates.customer_company_id_array = Array.isArray(data.customer_company_id_array) ? data.customer_company_id_array : [];
    }
    if (data.customer_product_id_array !== undefined) {
        updates.customer_product_id_array = Array.isArray(data.customer_product_id_array) ? data.customer_product_id_array : [];
    }
    if (Object.keys(updates).length === 0) {
        return toApiCustomer(row.get({ plain: true }));
    }
    await CustomerDbModel.update(updates, { where: { id_customer: idCustomer } });
    const updated = await CustomerDbModel.findByPk(idCustomer);
    return toApiCustomer(updated.get({ plain: true }));
}

export async function deleteCustomer(idCustomer) {
    const row = await CustomerDbModel.findByPk(idCustomer);
    if (!row) {
        throw new Error(`Customer with id ${idCustomer} not found`);
    }
    await row.destroy();
    return toApiCustomer(row.get({ plain: true }));
}
