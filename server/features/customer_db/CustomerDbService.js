import CustomerDbModel from "./CustomerDbModel.js";
import "../../database/models.js";

function toApiCustomer(row) {
    if (!row) return null;
    const contact = row.contact && typeof row.contact === "object" ? row.contact : {};
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
        segment: row.segment ?? "",
        owner: row.owner ?? "",
        source: row.source ?? "",
        status: row.status ?? "active",
        revenue_eur: row.revenue_eur != null ? Number(row.revenue_eur) : 0,
        next_activity: row.next_activity ?? "",
        tags: Array.isArray(row.tags) ? row.tags : [],
        contact: {
            name: contact.name ?? "",
            role: contact.role ?? "",
            email: contact.email ?? "",
            phone: contact.phone ?? "",
        },
        contacts: Array.isArray(row.contacts) ? row.contacts : [],
        comments: Array.isArray(row.comments) ? row.comments : [],
        proposals: Array.isArray(row.proposals) ? row.proposals : [],
        contracts: Array.isArray(row.contracts) ? row.contracts : [],
        projects: Array.isArray(row.projects) ? row.projects : [],
        related_accounts: Array.isArray(row.related_accounts) ? row.related_accounts : [],
        portal_products: row.portal_products && typeof row.portal_products === "object" ? row.portal_products : {},
        company_categories_array: Array.isArray(row.company_categories_array) ? row.company_categories_array : [],
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
        id_customer: data.id_customer || data.id_customer,
        name: data.name ?? "",
        cif: data.cif ?? "",
        country: data.country ?? "",
        address: data.address ?? "",
        phone: data.phone ?? "",
        email: data.email ?? "",
        website: data.website ?? "",
        industry: data.industry ?? "",
        segment: data.segment ?? "",
        owner: data.owner ?? "",
        source: data.source ?? "",
        status: data.status ?? "active",
        revenue_eur: data.revenue_eur != null ? Number(data.revenue_eur) : 0,
        next_activity: data.next_activity ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        contact: data.contact && typeof data.contact === "object" ? data.contact : {},
        contacts: Array.isArray(data.contacts) ? data.contacts : [],
        comments: Array.isArray(data.comments) ? data.comments : [],
        proposals: Array.isArray(data.proposals) ? data.proposals : [],
        contracts: Array.isArray(data.contracts) ? data.contracts : [],
        projects: Array.isArray(data.projects) ? data.projects : [],
        related_accounts: Array.isArray(data.related_accounts) ? data.related_accounts : [],
        portal_products: data.portal_products && typeof data.portal_products === "object" ? data.portal_products : {},
        company_categories_array: Array.isArray(data.company_categories_array) ? data.company_categories_array : [],
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
    if (data.segment !== undefined) updates.segment = data.segment;
    if (data.owner !== undefined) updates.owner = data.owner;
    if (data.source !== undefined) updates.source = data.source;
    if (data.status !== undefined) updates.status = data.status;
    if (data.revenue_eur !== undefined) updates.revenue_eur = data.revenue_eur;
    if (data.next_activity !== undefined) updates.next_activity = data.next_activity;
    if (data.tags !== undefined) updates.tags = Array.isArray(data.tags) ? data.tags : [];
    if (data.contact !== undefined) updates.contact = data.contact && typeof data.contact === "object" ? data.contact : {};
    if (data.contacts !== undefined) updates.contacts = Array.isArray(data.contacts) ? data.contacts : [];
    if (data.comments !== undefined) updates.comments = Array.isArray(data.comments) ? data.comments : [];
    if (data.proposals !== undefined) updates.proposals = Array.isArray(data.proposals) ? data.proposals : [];
    if (data.contracts !== undefined) updates.contracts = Array.isArray(data.contracts) ? data.contracts : [];
    if (data.projects !== undefined) updates.projects = Array.isArray(data.projects) ? data.projects : [];
    if (data.related_accounts !== undefined) updates.related_accounts = Array.isArray(data.related_accounts) ? data.related_accounts : [];
    if (data.portal_products !== undefined) updates.portal_products = data.portal_products && typeof data.portal_products === "object" ? data.portal_products : {};
    if (data.company_categories_array !== undefined) {
        updates.company_categories_array = Array.isArray(data.company_categories_array) ? data.company_categories_array : [];
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
