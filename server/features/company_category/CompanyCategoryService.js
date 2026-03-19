import CompanyCategoryModel from "./CompanyCategoryModel.js";
import "../../database/models.js";

function toApiCategory(row) {
    if (!row) return null;
    return {
        id_category: row.id_category,
        name: row.name ?? "",
        description: row.description ?? "",
        portals_array: Array.isArray(row.portals_array) ? row.portals_array : [],
    };
}

export async function getAllCategories() {
    try {
        if (!CompanyCategoryModel.sequelize) {
            console.warn("CompanyCategoryModel not initialized, returning empty array");
            return [];
        }
        const rows = await CompanyCategoryModel.findAll({
            order: [["name", "ASC"]],
        });
        return rows.map(toApiCategory);
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
    return toApiCategory(row);
}

export async function createCategory(data) {
    if (!CompanyCategoryModel.sequelize) {
        throw new Error("CompanyCategoryModel not initialized");
    }
    const name = String(data.name ?? "").trim();
    const existing = await CompanyCategoryModel.findOne({
        where: CompanyCategoryModel.sequelize.where(
            CompanyCategoryModel.sequelize.fn("LOWER", CompanyCategoryModel.sequelize.col("name")),
            name.toLowerCase()
        ),
    });
    if (existing) {
        const err = new Error("A company category with this name already exists");
        err.status = 400;
        throw err;
    }
    const maxRow = await CompanyCategoryModel.findOne({
        attributes: [[CompanyCategoryModel.sequelize.literal("MAX(CAST(SUBSTRING(id_category FROM 5) AS INTEGER))"), "max_num"]],
        raw: true,
    });
    const nextNum = (Number(maxRow?.max_num) || 0) + 1;
    const id_category = `cat-${String(nextNum).padStart(3, "0")}`;
    const portals_array = Array.isArray(data.portals_array)
        ? data.portals_array.map((p) => String(p).trim()).filter(Boolean)
        : [];
    const row = await CompanyCategoryModel.create({
        id_category,
        name,
        description: typeof data.description === "string" ? data.description.trim() : "",
        portals_array,
    });
    return toApiCategory(row);
}

export async function deleteCategory(idCategory) {
    const row = await CompanyCategoryModel.findByPk(idCategory);
    if (!row) {
        throw new Error(`Category with id ${idCategory} not found`);
    }
    await row.destroy();
    return toApiCategory(row);
}
