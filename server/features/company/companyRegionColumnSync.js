import CompanyModel from "./CompanyModel.js";
import { QueryTypes } from "sequelize";

/**
 * Map Sequelize `region` to the real physical column. RDS may still have
 * `company_category` until migration 010; after rename only `company_region` exists.
 *
 * This is re-run on every call (no long-lived flag). If the DB is migrated while the
 * Node process keeps running, the next request picks up `company_region` without restart.
 * Otherwise a cached mapping to `company_category` can cause "column does not exist".
 */
export async function ensureCompanyRegionColumnMapped(sequelize) {
    if (!sequelize || !CompanyModel.rawAttributes?.region) return;
    try {
        const rows = await sequelize.query(
            `SELECT column_name FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'companies_db'
               AND column_name IN ('company_region', 'company_category')`,
            { type: QueryTypes.SELECT }
        );
        const names = new Set((rows || []).map((r) => String(r?.column_name ?? "")));
        if (names.has("company_region")) {
            CompanyModel.rawAttributes.region.field = "company_region";
        } else if (names.has("company_category")) {
            CompanyModel.rawAttributes.region.field = "company_category";
        }
    } catch {
        // keep default from models.js
    }
}
