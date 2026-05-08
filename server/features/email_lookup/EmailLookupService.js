import "../../database/models.js";
import CustomerDbModel from "../customer_db/CustomerDbModel.js";

function getSequelize() {
    const s = CustomerDbModel.sequelize;
    if (!s) {
        throw new Error("Database not configured. Set DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD, DATABASE_HOST, DATABASE_PORT in .env (see .env.example).");
    }
    return s;
}

function normalizeEmail(raw) {
    return String(raw ?? "")
        .trim()
        .toLowerCase();
}

/**
 * Case-insensitive exact match on primary email columns (and company web_link / mailto when applicable).
 * @param {string} email
 * @returns {Promise<{
 *   customers: Array<{ id: string; label: string }>,
 *   contacts: Array<{ id: string; label: string }>,
 *   companies: Array<{ id: string; label: string }>,
 *   users: Array<{ id: string; label: string; email: string }>
 * }>}
 */
export async function findEntitiesByEmail(email) {
    const norm = normalizeEmail(email);
    if (!norm || !norm.includes("@")) {
        return { customers: [], contacts: [], companies: [], users: [] };
    }
    const sequelize = getSequelize();

    const run = async (sql, replacements) => {
        const [rows] = await sequelize.query(sql, { replacements });
        return Array.isArray(rows) ? rows : [];
    };

    const [customers, contacts, companies, users] = await Promise.all([
        run(
            `SELECT customer_id AS id, customer_account_name AS label
             FROM public.customers_db
             WHERE LOWER(TRIM(customer_main_email)) = :norm`,
            { norm }
        ).catch(() => []),
        run(
            `SELECT contact_id AS id, contact_name AS label
             FROM public.contacts_db
             WHERE LOWER(TRIM(contact_email)) = :norm`,
            { norm }
        ).catch(() => []),
        (async () => {
            try {
                const raw = String(email ?? "").trim();
                const mailtoNorm = raw.toLowerCase().startsWith("mailto:")
                    ? raw.toLowerCase()
                    : `mailto:${raw}`.toLowerCase();
                return await run(
                    `SELECT company_id AS id, company_commercial_name AS label
                     FROM public.companies_db
                     WHERE LOWER(TRIM(COALESCE(company_web_link, ''))) IN (:norm, :mailtoNorm)`,
                    { norm, mailtoNorm }
                );
            } catch {
                return [];
            }
        })(),
        run(
            `SELECT user_id::text AS id,
                    TRIM(COALESCE(user_name, '') || ' ' || COALESCE(user_surnames, '')) AS label,
                    user_email AS email
             FROM public.users_db
             WHERE LOWER(TRIM(user_email)) = :norm`,
            { norm }
        ).catch(() => []),
    ]);

    const mapRow = (r) => ({
        id: String(r?.id ?? "").trim(),
        label: String(r?.label ?? "").trim() || String(r?.id ?? "").trim(),
    });

    return {
        customers: customers.filter((r) => r?.id).map(mapRow),
        contacts: contacts.filter((r) => r?.id).map(mapRow),
        companies: companies.filter((r) => r?.id).map(mapRow),
        users: users
            .filter((r) => r?.id)
            .map((r) => ({
                id: String(r.id).trim(),
                label: String(r?.label ?? "").trim() || String(r?.email ?? "").trim(),
                email: String(r?.email ?? "").trim(),
            })),
    };
}
