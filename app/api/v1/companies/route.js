import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllCompanies, createCompany } from "../../../../server/features/company/CompanyService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const companies = await getAllCompanies();
    return NextResponse.json(companies);
}, null, true);

export const POST = createEndpoint(async (request, body) => {
    const company = await createCompany(body);
    return NextResponse.json(company);
}, Joi.object({
    companyId: Joi.string().required(),
    commercialName: Joi.string().required(),
    country: Joi.string().allow("").optional(),
    category: Joi.string().allow("").optional(),
    mainDescription: Joi.string().allow("").optional(),
    mainImage: Joi.string().allow("").optional(),
    productsArray: Joi.array().items(Joi.string()).optional(),
    categoriesArray: Joi.array().items(Joi.string()).optional(),
    mainEmail: Joi.string().allow("").optional(),
    mailTelephone: Joi.string().allow("").optional(),
    fullAddress: Joi.string().allow("").optional(),
    webLink: Joi.string().allow("").optional(),
    portalIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
}), true);
