import CompanyModel from "./CompanyModel.js";
import { createCompanyPortals } from "./CompanyPortalService.js";
import "../../database/models.js";

function toApiCompany(row) {
    if (!row) return null;
    return {
        companyId: row.company_id,
        commercialName: row.commercial_name,
        country: row.country ?? "",
        category: row.category ?? "",
        mainDescription: row.main_description ?? "",
        mainImage: row.main_image ?? "",
        productsArray: [],
        categoriesArray: [],
        mainEmail: row.main_email ?? "",
        mailTelephone: row.mail_telephone ?? "",
        fullAddress: row.full_address ?? "",
        webLink: row.web_link ?? "",
    };
}

export async function getAllCompanies() {
    try {
        if (!CompanyModel.sequelize) {
            console.warn("CompanyModel not initialized, returning empty array");
            return [];
        }
        const rows = await CompanyModel.findAll({
            order: [["commercial_name", "ASC"]],
        });
        return rows.map(toApiCompany);
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
    const row = await CompanyModel.findByPk(idCompany);
    if (!row) {
        throw new Error(`Company with id ${idCompany} not found`);
    }
    return toApiCompany(row);
}

export async function createCompany(data) {
    if (!CompanyModel.sequelize) {
        throw new Error("CompanyModel not initialized");
    }
    const payload = {
        company_id: data.companyId,
        commercial_name: data.commercialName,
        country: data.country ?? "",
        category: data.category ?? "",
        main_description: data.mainDescription ?? "",
        main_image: data.mainImage ?? "",
        products_array: Array.isArray(data.productsArray) ? data.productsArray : [],
        categories_array: Array.isArray(data.categoriesArray) ? data.categoriesArray : [],
        main_email: data.mainEmail ?? "",
        mail_telephone: data.mailTelephone ?? "",
        full_address: data.fullAddress ?? "",
        web_link: data.webLink ?? "",
    };
    const row = await CompanyModel.create(payload);
    const portalIds = Array.isArray(data.portalIds) ? data.portalIds.filter((id) => Number.isInteger(Number(id))).map(Number) : [];
    if (portalIds.length > 0) {
        await createCompanyPortals(row.company_id, portalIds, data.commercialName ?? "");
    }
    return toApiCompany(row);
}

export async function updateCompany(idCompany, data) {
    const row = await CompanyModel.findByPk(idCompany);
    if (!row) {
        throw new Error(`Company with id ${idCompany} not found`);
    }
    const updates = {};
    if (data.commercialName !== undefined) updates.commercial_name = data.commercialName;
    if (data.country !== undefined) updates.country = data.country;
    if (data.category !== undefined) updates.category = data.category;
    if (data.mainDescription !== undefined) updates.main_description = data.mainDescription;
    if (data.mainImage !== undefined) updates.main_image = data.mainImage;
    if (data.mainEmail !== undefined) updates.main_email = data.mainEmail;
    if (data.mailTelephone !== undefined) updates.mail_telephone = data.mailTelephone;
    if (data.fullAddress !== undefined) updates.full_address = data.fullAddress;
    if (data.webLink !== undefined) updates.web_link = data.webLink;
    if (Object.keys(updates).length === 0) {
        return toApiCompany(row);
    }
    await CompanyModel.update(updates, { where: { company_id: idCompany } });
    const updated = await CompanyModel.findByPk(idCompany);
    return toApiCompany(updated);
}

export async function deleteCompany(idCompany) {
    const row = await CompanyModel.findByPk(idCompany);
    if (!row) {
        throw new Error(`Company with id ${idCompany} not found`);
    }
    await row.destroy();
    return toApiCompany(row);
}
