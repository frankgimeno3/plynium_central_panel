import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getCompanyById, updateCompany, deleteCompany } from "../../../../../server/features/company/CompanyService.js";
import Joi from "joi";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/companies\/([^/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error("Company ID not found in URL");
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const company = await getCompanyById(id);
    return NextResponse.json(company);
}, null, true);

export const PUT = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const company = await updateCompany(id, body);
    return NextResponse.json(company);
}, Joi.object({
    commercialName: Joi.string().optional(),
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
}), true);

export const DELETE = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const company = await deleteCompany(id);
    return NextResponse.json(company);
}, null, true);
