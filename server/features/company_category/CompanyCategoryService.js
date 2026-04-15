import CompanyCategoryModel from "./CompanyCategoryModel.js";
import "../../database/models.js";

function dbField(attr) {
    return CompanyCategoryModel?.rawAttributes?.[attr]?.field ?? attr;
}

function toApiCategory(row) {
    if (!row) return null;
    return {
        category_id: row.id_category,
        category_name: row.name ?? "",
        category_description: row.description ?? "",
        portals_array: [],
        portal_ids: [],
        category_created_at: row.createdAt ?? null,
        category_updated_at: row.updatedAt ?? null,
    };
}

async function attachPortalsToCategories(list) {
    const sequelize = CompanyCategoryModel.sequelize;
    if (!sequelize) return list;
    const ids = (Array.isArray(list) ? list : [])
        .map((c) => c?.category_id)
        .filter((id) => typeof id === "string" && id.trim().length > 0);
    if (ids.length === 0) return list;

    const [rows] = await sequelize.query(
        `
        SELECT ccp.category_id,
               ccp.portal_id,
               p.portal_name AS portal_name
          FROM public.company_categories_portal ccp
          JOIN public.portals_db p ON p.portal_id = ccp.portal_id
         WHERE ccp.category_id IN (:ids)
         ORDER BY ccp.category_id ASC, p.portal_id ASC
        `,
        { replacements: { ids } }
    );
    const map = new Map();
    const mapIds = new Map();
    for (const r of Array.isArray(rows) ? rows : []) {
        const cid = r?.category_id;
        const pname = r?.portal_name;
        const pid = r?.portal_id;
        if (typeof cid !== "string") continue;
        if (!map.has(cid)) map.set(cid, []);
        if (!mapIds.has(cid)) mapIds.set(cid, []);
        if (typeof pname === "string" && pname.trim().length > 0) map.get(cid).push(pname);
        if (Number.isInteger(pid) && pid >= 0) mapIds.get(cid).push(pid);
    }
    return list.map((c) => ({
        ...c,
        portals_array: map.get(c.category_id) ?? [],
        portal_ids: mapIds.get(c.category_id) ?? [],
    }));
}

export async function setCategoryPortals(categoryId, portalIds) {
    if (!CompanyCategoryModel.sequelize) {
        throw new Error("CompanyCategoryModel not initialized");
    }
    const sequelize = CompanyCategoryModel.sequelize;
    const ids = Array.isArray(portalIds)
        ? portalIds.filter((x) => Number.isInteger(x) && x >= 0)
        : [];

    await sequelize.transaction(async (t) => {
        await sequelize.query(
            `DELETE FROM public.company_categories_portal WHERE category_id = :category_id`,
            { replacements: { category_id: categoryId }, transaction: t }
        );
        for (const portal_id of ids) {
            await sequelize.query(
                `
                INSERT INTO public.company_categories_portal (category_id, portal_id)
                VALUES (:category_id, :portal_id)
                ON CONFLICT (category_id, portal_id) DO NOTHING
                `,
                { replacements: { category_id: categoryId, portal_id }, transaction: t }
            );
        }
    });
    const category = await getCategoryById(categoryId);
    return category;
}

export async function getAllCategories() {
    try {
        if (!CompanyCategoryModel.sequelize) {
            console.warn("CompanyCategoryModel not initialized, returning empty array");
            return [];
        }
        const rows = await CompanyCategoryModel.findAll({
            // Ensure SQL orders by real DB column (category_name)
            order: [[CompanyCategoryModel.sequelize.col(dbField("name")), "ASC"]],
        });
        const list = rows.map(toApiCategory);
        return await attachPortalsToCategories(list);
    } catch (error) {
        console.error("Error fetching company categories from database:", error);
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

export async function getCategoryById(idCategory) {
    const row = await CompanyCategoryModel.findByPk(idCategory);
    if (!row) {
        throw new Error(`Category with id ${idCategory} not found`);
    }
    const list = await attachPortalsToCategories([toApiCategory(row)]);
    return list[0] ?? null;
}

export async function createCategory(data) {
    if (!CompanyCategoryModel.sequelize) {
        throw new Error("CompanyCategoryModel not initialized");
    }
    const category_name = String(data.category_name ?? data.name ?? "").trim();
    const existing = await CompanyCategoryModel.findOne({
        where: CompanyCategoryModel.sequelize.where(
            CompanyCategoryModel.sequelize.fn("LOWER", CompanyCategoryModel.sequelize.col(dbField("name"))),
            category_name.toLowerCase()
        ),
    });
    if (existing) {
        const err = new Error("A company category with this name already exists");
        err.status = 400;
        throw err;
    }
    const maxRow = await CompanyCategoryModel.findOne({
        // Use real DB column name (category_id)
        attributes: [[CompanyCategoryModel.sequelize.literal("MAX(CAST(SUBSTRING(category_id FROM 5) AS INTEGER))"), "max_num"]],
        raw: true,
    });
    const nextNum = (Number(maxRow?.max_num) || 0) + 1;
    const id_category = `cat-${String(nextNum).padStart(3, "0")}`;
    const row = await CompanyCategoryModel.create({
        id_category,
        name: category_name,
        description:
            typeof data.category_description === "string"
                ? data.category_description.trim()
                : typeof data.description === "string"
                    ? data.description.trim()
                    : "",
    });
    const sequelize = CompanyCategoryModel.sequelize;
    const portalIds = Array.isArray(data.portal_ids)
        ? data.portal_ids.filter((x) => Number.isInteger(x) && x >= 0)
        : [];
    if (portalIds.length > 0) {
        for (const portal_id of portalIds) {
            await sequelize.query(
                `
                INSERT INTO public.company_categories_portal (category_id, portal_id)
                VALUES (:category_id, :portal_id)
                ON CONFLICT (category_id, portal_id) DO NOTHING
                `,
                { replacements: { category_id: id_category, portal_id } }
            );
        }
    }
    const list = await attachPortalsToCategories([toApiCategory(row)]);
    return list[0] ?? toApiCategory(row);
}

export async function deleteCategory(idCategory) {
    const row = await CompanyCategoryModel.findByPk(idCategory);
    if (!row) {
        throw new Error(`Category with id ${idCategory} not found`);
    }
    await row.destroy();
    return toApiCategory(row);
}
