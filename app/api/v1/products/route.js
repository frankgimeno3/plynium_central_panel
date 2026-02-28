import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllProducts, getProductsByCompanyId, createProduct } from "../../../../server/features/product/ProductService.js";
import Joi from "joi";

export const runtime = "nodejs";

const getSchema = Joi.object({
    companyId: Joi.string().optional().allow(""),
});

export const GET = createEndpoint(async (request, body) => {
    const companyId = (body?.companyId ?? "").toString().trim();
    const products = companyId
        ? await getProductsByCompanyId(companyId)
        : await getAllProducts();
    return NextResponse.json(products);
}, getSchema, true);

export const POST = createEndpoint(async (request, body) => {
    const product = await createProduct(body);
    return NextResponse.json(product);
}, Joi.object({
    productId: Joi.string().required(),
    productName: Joi.string().required(),
    price: Joi.number().min(0).required(),
    company: Joi.string().allow("").optional(),
    productDescription: Joi.string().allow("").optional(),
    mainImageSrc: Joi.string().allow("").optional(),
    productCategoriesArray: Joi.array().items(Joi.string()).optional(),
    portalIds: Joi.array().items(Joi.number().integer().min(1)).optional(),
}), true);
