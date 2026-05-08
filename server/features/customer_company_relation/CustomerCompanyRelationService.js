import "../../database/models.js";
import CustomerDbModel from "../customer_db/CustomerDbModel.js";

function getSequelize() {
    const s = CustomerDbModel.sequelize;
    if (!s) {
        throw new Error("Database not configured. Set DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT in .env (see .env.example).");
    }
    return s;
}

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {string} companyId
 * @returns {Promise<Array<{ customer_company_relation_id: string, customer_id: string, company_id: string, customer_name: string }>>}
 */
export async function listRelationsByCompany(companyId) {
    const sequelize = getSequelize();
    const cid = String(companyId ?? "").trim();
    if (!cid) return [];
    try {
        const [rows] = await sequelize.query(
            `SELECT r.customer_company_relation_id::text AS customer_company_relation_id,
                    r.customer_id,
                    r.company_id,
                    COALESCE(c.customer_account_name, '') AS customer_name
             FROM public.customer_company_relations r
             LEFT JOIN public.customers_db c ON c.customer_id = r.customer_id
             WHERE r.company_id = :companyId
             ORDER BY c.customer_account_name ASC NULLS LAST, r.customer_id ASC`,
            { replacements: { companyId: cid } }
        );
        return (rows || []).map((r) => ({
            customer_company_relation_id: String(r?.customer_company_relation_id ?? ""),
            customer_id: String(r?.customer_id ?? ""),
            company_id: String(r?.company_id ?? ""),
            customer_name: String(r?.customer_name ?? "").trim() || String(r?.customer_id ?? ""),
        }));
    } catch (e) {
        const msg = String(e?.message || e?.original?.message || "");
        if (msg.includes("customer_company_relations") && msg.includes("does not exist")) return [];
        throw e;
    }
}

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {string} customerId
 * @returns {Promise<Array<{ customer_company_relation_id: string, customer_id: string, company_id: string, company_name: string }>>}
 */
export async function listRelationsByCustomer(customerId) {
    const sequelize = getSequelize();
    const kid = String(customerId ?? "").trim();
    if (!kid) return [];
    try {
        const [rows] = await sequelize.query(
            `SELECT r.customer_company_relation_id::text AS customer_company_relation_id,
                    r.customer_id,
                    r.company_id,
                    COALESCE(comp.company_commercial_name, '') AS company_name
             FROM public.customer_company_relations r
             LEFT JOIN public.companies_db comp ON comp.company_id = r.company_id
             WHERE r.customer_id = :customerId
             ORDER BY comp.company_commercial_name ASC NULLS LAST, r.company_id ASC`,
            { replacements: { customerId: kid } }
        );
        return (rows || []).map((r) => ({
            customer_company_relation_id: String(r?.customer_company_relation_id ?? ""),
            customer_id: String(r?.customer_id ?? ""),
            company_id: String(r?.company_id ?? ""),
            company_name: String(r?.company_name ?? "").trim() || String(r?.company_id ?? ""),
        }));
    } catch (e) {
        const msg = String(e?.message || e?.original?.message || "");
        if (msg.includes("customer_company_relations") && msg.includes("does not exist")) return [];
        throw e;
    }
}

/**
 * @param {string} customerId
 * @param {string} companyId
 */
export async function createRelation(customerId, companyId) {
    const sequelize = getSequelize();
    const c = String(customerId ?? "").trim();
    const co = String(companyId ?? "").trim();
    if (!c || !co) {
        throw new Error("customer_id and company_id are required");
    }
    const [custRows] = await sequelize.query(
        `SELECT customer_id FROM public.customers_db WHERE customer_id = :c LIMIT 1`,
        { replacements: { c } }
    );
    const cust = custRows && custRows[0];
    if (!cust) {
        throw new Error("Customer not found");
    }
    const [compRows] = await sequelize.query(
        `SELECT company_id FROM public.companies_db WHERE company_id = :co LIMIT 1`,
        { replacements: { co } }
    );
    const comp = compRows && compRows[0];
    if (!comp) {
        throw new Error("Company not found");
    }
    const [insRows] = await sequelize.query(
        `INSERT INTO public.customer_company_relations (customer_id, company_id)
         VALUES (:c, :co)
         ON CONFLICT (customer_id, company_id) DO NOTHING
         RETURNING customer_company_relation_id::text AS customer_company_relation_id, customer_id, company_id`,
        { replacements: { c, co } }
    );
    let inserted = insRows && insRows[0];
    if (!inserted) {
        const [existingRows] = await sequelize.query(
            `SELECT customer_company_relation_id::text AS customer_company_relation_id, customer_id, company_id
             FROM public.customer_company_relations
             WHERE customer_id = :c AND company_id = :co
             LIMIT 1`,
            { replacements: { c, co } }
        );
        inserted = existingRows && existingRows[0];
    }
    if (!inserted) {
        throw new Error("Failed to create relation");
    }
    return {
        customer_company_relation_id: String(inserted.customer_company_relation_id ?? ""),
        customer_id: String(inserted.customer_id ?? c),
        company_id: String(inserted.company_id ?? co),
    };
}

/**
 * @param {string} relationId
 */
export async function deleteRelation(relationId) {
    const sequelize = getSequelize();
    const id = String(relationId ?? "").trim();
    if (!id) {
        throw new Error("Relation id is required");
    }
    const [delRows] = await sequelize.query(
        `DELETE FROM public.customer_company_relations
         WHERE customer_company_relation_id = CAST(:id AS uuid)
         RETURNING customer_company_relation_id::text AS customer_company_relation_id`,
        { replacements: { id } }
    );
    const row = delRows && delRows[0];
    if (!row) {
        throw new Error("Relation not found");
    }
    return { customer_company_relation_id: String(row.customer_company_relation_id ?? id) };
}
