import { QueryTypes } from "sequelize";

/** panel_ticket_company_data columns before migration 096 */
const LEGACY_COMPANY_CONTENT_ATTRIBUTES = [
    "ticket_company_data_id",
    "ticket_id",
    "ticket_company_name",
    "ticket_company_tax_name",
    "ticket_company_tax_id",
    "ticket_company_creator_role",
    "ticket_company_website",
    "ticket_company_country",
    "ticket_company_description"
];

let cachedHasListAsEmployee = null;

/**
 * Whether public.panel_ticket_company_data has ticket_company_list_as_employee (migration 096).
 * Result is cached for the process lifetime.
 * @param {import("sequelize").Sequelize | null | undefined} sequelize
 */
export async function panelTicketCompanyDataHasListAsEmployeeColumn(sequelize) {
    if (cachedHasListAsEmployee !== null) return cachedHasListAsEmployee;
    if (!sequelize) {
        cachedHasListAsEmployee = false;
        return false;
    }
    try {
        const rows = await sequelize.query(
            `SELECT 1 AS ok
             FROM information_schema.columns
             WHERE table_schema = 'public'
               AND table_name = 'panel_ticket_company_data'
               AND column_name = 'ticket_company_list_as_employee'
             LIMIT 1`,
            { type: QueryTypes.SELECT }
        );
        cachedHasListAsEmployee = Array.isArray(rows) && rows.length > 0;
    } catch (e) {
        console.warn(
            "[panelTicketCompanyDataSchema] could not probe ticket_company_list_as_employee:",
            e?.message || e
        );
        cachedHasListAsEmployee = false;
    }
    return cachedHasListAsEmployee;
}

/**
 * Include options for NotificationCompanyContentDbModel so SELECT works on DBs
 * that have not yet run migration 096.
 * @param {import("sequelize").Model} NotificationCompanyContentDbModel
 * @param {import("sequelize").Sequelize} sequelize
 */
export async function notificationCompanyContentInclude(NotificationCompanyContentDbModel, sequelize) {
    const has = await panelTicketCompanyDataHasListAsEmployeeColumn(sequelize);
    const base = { model: NotificationCompanyContentDbModel, as: "company_content" };
    if (!has) return { ...base, attributes: LEGACY_COMPANY_CONTENT_ATTRIBUTES };
    return base;
}

/** Drop DB-only field when the column is absent (INSERT/UPDATE). */
export function omitTicketCompanyListAsEmployeeIfNeeded(cc, hasColumn) {
    if (hasColumn || cc == null) return cc;
    const rest = { ...cc };
    delete rest.ticket_company_list_as_employee;
    return rest;
}
