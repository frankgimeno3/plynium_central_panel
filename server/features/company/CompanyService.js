import CompanyModel from "./CompanyModel.js";
import { createCompanyPortals } from "./CompanyPortalService.js";
import { ensureCompanyRegionColumnMapped } from "./companyRegionColumnSync.js";
import { regionFromCountry } from "./regionFromCountry.js";
import "../../database/models.js";
import Database from "../../database/database.js";
import { QueryTypes } from "sequelize";

export { ensureCompanyRegionColumnMapped } from "./companyRegionColumnSync.js";

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {string[]} names
 * @returns {Promise<string[]>}
 */
async function resolveCategoryIdsByNames(sequelize, names) {
    const list = Array.isArray(names) ? names.map((s) => String(s ?? "").trim()).filter(Boolean) : [];
    if (list.length === 0) return [];
    const lowerUniq = [...new Set(list.map((n) => n.toLowerCase()))];
    const keys = lowerUniq.map((_, i) => `cn${i}`);
    const ph = keys.map((k) => `:${k}`).join(", ");
    const replacements = Object.fromEntries(lowerUniq.map((n, i) => [keys[i], n]));
    const rows = await sequelize.query(
        `SELECT category_id, LOWER(TRIM(category_name)) AS n FROM public.company_categories
         WHERE LOWER(TRIM(category_name)) IN (${ph})`,
        { replacements, type: QueryTypes.SELECT }
    );
    const byName = new Map();
    for (const r of rows || []) {
        const id = String(r?.category_id ?? "").trim();
        const k = String(r?.n ?? "").trim().toLowerCase();
        if (k && id) byName.set(k, id);
    }
    const out = [];
    const seen = new Set();
    for (const n of list) {
        const id = byName.get(n.toLowerCase());
        if (id && !seen.has(id)) {
            seen.add(id);
            out.push(id);
        }
    }
    return out;
}

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {string} companyId
 * @param {string[]} categoryIds
 * @param {import("sequelize").Transaction} [transaction]
 */
async function setCompanyCategoryRelations(sequelize, companyId, categoryIds, transaction) {
    const uniq = [...new Set((categoryIds || []).map((x) => String(x ?? "").trim()).filter(Boolean))];
    try {
        await sequelize.query(`DELETE FROM public.company_category_relations WHERE company_id = :companyId`, {
            replacements: { companyId },
            transaction,
        });
        for (const catId of uniq) {
            await sequelize.query(
                `INSERT INTO public.company_category_relations (company_id, category_id)
                 VALUES (:companyId, :catId)`,
                { replacements: { companyId, catId }, transaction }
            );
        }
    } catch (e) {
        const msg = String(e?.message || e?.original?.message || "");
        if (!msg.includes("company_category_relations") && !msg.includes("does not exist")) throw e;
    }
}

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {string[]} companyIds
 * @returns {Promise<Map<string, { categoryIds: string[], categoryNames: string[] }>>}
 */
async function loadCategoryRelationsBatch(sequelize, companyIds) {
    const map = new Map();
    if (!Array.isArray(companyIds) || companyIds.length === 0) return map;
    const uniq = [...new Set(companyIds.map((x) => String(x ?? "").trim()).filter(Boolean))];
    let rows;
    try {
        const keys = uniq.map((_, i) => `cid${i}`);
        const ph = keys.map((k) => `:${k}`).join(", ");
        const replacements = Object.fromEntries(uniq.map((id, i) => [keys[i], id]));
        rows = await sequelize.query(
            `SELECT r.company_id, r.category_id, c.category_name
             FROM public.company_category_relations r
             INNER JOIN public.company_categories c ON c.category_id = r.category_id
             WHERE r.company_id IN (${ph})`,
            { replacements, type: QueryTypes.SELECT }
        );
    } catch {
        return map;
    }
    for (const r of rows || []) {
        const cid = String(r?.company_id ?? "");
        const id = String(r?.category_id ?? "");
        const name = String(r?.category_name ?? "");
        if (!cid) continue;
        if (!map.has(cid)) map.set(cid, { categoryIds: [], categoryNames: [] });
        const entry = map.get(cid);
        entry.categoryIds.push(id);
        entry.categoryNames.push(name);
    }
    return map;
}

/**
 * @param {import("sequelize").Sequelize} sequelize
 * @param {string} companyId
 */
async function loadCategoryRelationsForOne(sequelize, companyId) {
    const m = await loadCategoryRelationsBatch(sequelize, [companyId]);
    return m.get(companyId) ?? { categoryIds: [], categoryNames: [] };
}

function toApiCompany(row, rel = { categoryIds: [], categoryNames: [] }) {
    if (!row) return null;
    const plain = row.get ? row.get({ plain: true }) : row;
    const names = rel.categoryNames ?? [];
    const ids = rel.categoryIds ?? [];
    return {
        companyId: plain.company_id,
        commercialName: plain.commercial_name,
        country: plain.country ?? "",
        region: plain.region ?? "",
        categoryIds: ids,
        categoryNames: names,
        /** Comma-separated business categories (for directory table). */
        categoriesSummary: names.length ? names.join(", ") : "",
        /** @deprecated use categoryNames — kept for older UI; same as categoryNames */
        categoriesArray: names,
        mainDescription: plain.main_description ?? "",
        mainImage: plain.main_image ?? "",
        mailTelephone: plain.mail_telephone ?? "",
        fullAddress: plain.full_address ?? "",
        webLink: plain.web_link ?? "",
        employeeRelationsArray: Array.isArray(plain.employee_relations_array) ? plain.employee_relations_array : [],
        productsArray: [],
        mainEmail: "",
    };
}

export async function getAllCompanies() {
    try {
        if (!CompanyModel.sequelize) {
            console.warn("CompanyModel not initialized, returning empty array");
            return [];
        }
        await ensureCompanyRegionColumnMapped(CompanyModel.sequelize);
        const rows = await CompanyModel.findAll({
            order: [["commercial_name", "ASC"]],
        });
        const ids = rows.map((r) => r.company_id).filter(Boolean);
        const relMap = await loadCategoryRelationsBatch(CompanyModel.sequelize, ids);
        return rows.map((row) => {
            const rel = relMap.get(row.company_id) ?? { categoryIds: [], categoryNames: [] };
            return toApiCompany(row, rel);
        });
    } catch (error) {
        console.error("Error fetching companies from database:", error);
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

export async function getCompanyById(idCompany) {
    if (!CompanyModel.sequelize) {
        throw new Error("CompanyModel not initialized");
    }
    await ensureCompanyRegionColumnMapped(CompanyModel.sequelize);
    const row = await CompanyModel.findByPk(idCompany);
    if (!row) {
        throw new Error(`Company with id ${idCompany} not found`);
    }
    const rel = await loadCategoryRelationsForOne(CompanyModel.sequelize, idCompany);
    return toApiCompany(row, rel);
}

export async function createCompany(data) {
    if (!CompanyModel.sequelize) {
        throw new Error("CompanyModel not initialized");
    }
    await ensureCompanyRegionColumnMapped(CompanyModel.sequelize);
    const country = data.country ?? "";
    const region =
        data.region !== undefined && data.region !== null
            ? String(data.region)
            : data.category !== undefined && data.category !== null
              ? String(data.category)
              : regionFromCountry(country) || "";

    let categoryIds = Array.isArray(data.categoryIds) ? data.categoryIds : [];
    if ((!categoryIds || categoryIds.length === 0) && Array.isArray(data.categoriesArray)) {
        const namesOrIds = data.categoriesArray.map(String);
        const looksLikeIds = namesOrIds.some((s) => /^cat[-_]/.test(s.trim()));
        if (looksLikeIds) {
            categoryIds = namesOrIds.map((s) => s.trim()).filter(Boolean);
        } else if (namesOrIds.length) {
            categoryIds = await resolveCategoryIdsByNames(CompanyModel.sequelize, namesOrIds);
        }
    }

    const payload = {
        company_id: data.companyId,
        commercial_name: data.commercialName,
        country,
        region,
        main_description: data.mainDescription ?? "",
        main_image: data.mainImage ?? "",
        mail_telephone: data.mailTelephone ?? "",
        full_address: data.fullAddress ?? "",
        web_link: data.webLink ?? "",
        employee_relations_array: Array.isArray(data.employeeRelationsArray) ? data.employeeRelationsArray : [],
    };
    const row = await CompanyModel.create(payload);
    await setCompanyCategoryRelations(CompanyModel.sequelize, row.company_id, categoryIds, undefined);
    const portalIds = Array.isArray(data.portalIds) ? data.portalIds.filter((id) => Number.isInteger(Number(id))).map(Number) : [];
    if (portalIds.length > 0) {
        await createCompanyPortals(row.company_id, portalIds, data.commercialName ?? "");
    }
    const rel = await loadCategoryRelationsForOne(CompanyModel.sequelize, row.company_id);
    return toApiCompany(row, rel);
}

export async function updateCompany(idCompany, data) {
    if (!CompanyModel.sequelize) {
        throw new Error("CompanyModel not initialized");
    }
    await ensureCompanyRegionColumnMapped(CompanyModel.sequelize);
    const row = await CompanyModel.findByPk(idCompany);
    if (!row) {
        throw new Error(`Company with id ${idCompany} not found`);
    }
    const updates = {};
    if (data.commercialName !== undefined) updates.commercial_name = data.commercialName;
    if (data.country !== undefined) updates.country = data.country;
    if (data.region !== undefined) {
        updates.region = String(data.region ?? "");
    } else if (data.country !== undefined) {
        updates.region = regionFromCountry(data.country) || "";
    } else if (data.category !== undefined) {
        updates.region = String(data.category ?? "");
    }
    if (data.mainDescription !== undefined) updates.main_description = data.mainDescription;
    if (data.mainImage !== undefined) updates.main_image = data.mainImage;
    if (data.mailTelephone !== undefined) updates.mail_telephone = data.mailTelephone;
    if (data.fullAddress !== undefined) updates.full_address = data.fullAddress;
    if (data.webLink !== undefined) updates.web_link = data.webLink;
    if (data.employeeRelationsArray !== undefined) {
        updates.employee_relations_array = Array.isArray(data.employeeRelationsArray) ? data.employeeRelationsArray : [];
    }

    const sequelize = CompanyModel.sequelize;
    const wantsRelUpdate = data.categoryIds !== undefined || data.categoriesArray !== undefined;

    if (Object.keys(updates).length === 0 && !wantsRelUpdate) {
        const rel = await loadCategoryRelationsForOne(sequelize, idCompany);
        return toApiCompany(row, rel);
    }

    await sequelize.transaction(async (t) => {
        if (Object.keys(updates).length > 0) {
            await CompanyModel.update(updates, { where: { company_id: idCompany }, transaction: t });
        }
        if (wantsRelUpdate) {
            let categoryIds = Array.isArray(data.categoryIds) ? [...data.categoryIds] : [];
            if ((!categoryIds || categoryIds.length === 0) && Array.isArray(data.categoriesArray)) {
                const raw = data.categoriesArray.map(String);
                const looksLikeIds = raw.some((s) => /^cat[-_]/.test(s.trim()));
                if (looksLikeIds) {
                    categoryIds = raw.map((s) => s.trim()).filter(Boolean);
                } else {
                    categoryIds = await resolveCategoryIdsByNames(sequelize, raw);
                }
            }
            await setCompanyCategoryRelations(sequelize, idCompany, categoryIds, t);
        }
    });

    const updated = await CompanyModel.findByPk(idCompany);
    const rel = await loadCategoryRelationsForOne(sequelize, idCompany);
    return toApiCompany(updated, rel);
}

export async function deleteCompany(idCompany) {
    if (!CompanyModel.sequelize) {
        throw new Error("CompanyModel not initialized");
    }
    await ensureCompanyRegionColumnMapped(CompanyModel.sequelize);
    const row = await CompanyModel.findByPk(idCompany);
    if (!row) throw new Error(`Company with id ${idCompany} not found`);

    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();

    await sequelize.transaction(async (t) => {
        try {
            await sequelize.query(`DELETE FROM public.company_category_relations WHERE company_id = :companyId`, {
                replacements: { companyId: idCompany },
                transaction: t,
            });
        } catch {
            // table may not exist before migration 010
        }

        await sequelize.query(
            `
              DELETE FROM public.product_portals
              WHERE product_id IN (
                SELECT product_id
                FROM public.products_db
                WHERE company_id = :companyId
              )
            `,
            { replacements: { companyId: idCompany }, transaction: t }
        );

        await sequelize.query(
            `DELETE FROM public.products_db WHERE company_id = :companyId`,
            { replacements: { companyId: idCompany }, transaction: t }
        );

        await sequelize.query(
            `DELETE FROM public.employee_relations WHERE employee_company_id = :companyId`,
            { replacements: { companyId: idCompany }, transaction: t }
        );

        await sequelize.query(
            `DELETE FROM public.company_portals WHERE company_id = :companyId`,
            { replacements: { companyId: idCompany }, transaction: t }
        );

        await sequelize.query(
            `DELETE FROM public.company_administrators WHERE company_id = :companyId`,
            { replacements: { companyId: idCompany }, transaction: t }
        );

        await sequelize.query(
            `DELETE FROM public.companies_db WHERE company_id = :companyId`,
            { replacements: { companyId: idCompany }, transaction: t }
        );
    });

    return toApiCompany(row, { categoryIds: [], categoryNames: [] });
}
