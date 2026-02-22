import ProductModel from "./ProductModel.js";
import "../../database/models.js";

function toApiProduct(row) {
    if (!row) return null;
    return {
        productId: row.product_id,
        productName: row.product_name,
        price: Number(row.price) ?? 0,
        company: row.company ?? "",
        productDescription: row.product_description ?? "",
        mainImageSrc: row.main_image_src ?? "",
        productCategoriesArray: [],
    };
}

export async function getAllProducts() {
    try {
        if (!ProductModel.sequelize) {
            console.warn("ProductModel not initialized, returning empty array");
            return [];
        }
        const rows = await ProductModel.findAll({
            order: [["product_name", "ASC"]],
        });
        return rows.map(toApiProduct);
    } catch (error) {
        console.error("Error fetching products from database:", error);
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

export async function getProductById(idProduct) {
    const row = await ProductModel.findByPk(idProduct);
    if (!row) {
        throw new Error(`Product with id ${idProduct} not found`);
    }
    return toApiProduct(row);
}

export async function createProduct(data) {
    if (!ProductModel.sequelize) {
        throw new Error("ProductModel not initialized");
    }
    const payload = {
        product_id: data.productId,
        product_name: data.productName,
        price: data.price ?? 0,
        company: data.company ?? "",
        product_description: data.productDescription ?? "",
        main_image_src: data.mainImageSrc ?? "",
        product_categories_array: Array.isArray(data.productCategoriesArray) ? data.productCategoriesArray : [],
    };
    const row = await ProductModel.create(payload);
    return toApiProduct(row);
}

export async function updateProduct(idProduct, data) {
    const row = await ProductModel.findByPk(idProduct);
    if (!row) {
        throw new Error(`Product with id ${idProduct} not found`);
    }
    const updates = {};
    if (data.productName !== undefined) updates.product_name = data.productName;
    if (data.price !== undefined) updates.price = data.price;
    if (data.company !== undefined) updates.company = data.company;
    if (data.productDescription !== undefined) updates.product_description = data.productDescription;
    if (data.mainImageSrc !== undefined) updates.main_image_src = data.mainImageSrc;
    if (Object.keys(updates).length === 0) {
        return toApiProduct(row);
    }
    await ProductModel.update(updates, { where: { product_id: idProduct } });
    const updated = await ProductModel.findByPk(idProduct);
    return toApiProduct(updated);
}

export async function deleteProduct(idProduct) {
    const row = await ProductModel.findByPk(idProduct);
    if (!row) {
        throw new Error(`Product with id ${idProduct} not found`);
    }
    await row.destroy();
    return toApiProduct(row);
}
