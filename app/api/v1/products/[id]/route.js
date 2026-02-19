import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getProductById, updateProduct, deleteProduct } from "../../../../../server/features/product/ProductService.js";
import Joi from "joi";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/products\/([^/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error("Product ID not found in URL");
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const product = await getProductById(id);
    return NextResponse.json(product);
}, null, true);

export const PUT = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const product = await updateProduct(id, body);
    return NextResponse.json(product);
}, Joi.object({
    productName: Joi.string().optional(),
    price: Joi.number().min(0).optional(),
    company: Joi.string().allow("").optional(),
    productDescription: Joi.string().allow("").optional(),
    mainImageSrc: Joi.string().allow("").optional(),
    productCategoriesArray: Joi.array().items(Joi.string()).optional(),
}), true);

export const DELETE = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const product = await deleteProduct(id);
    return NextResponse.json(product);
}, null, true);
