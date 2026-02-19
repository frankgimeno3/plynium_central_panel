import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllProducts, createProduct } from "../../../../server/features/product/ProductService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const products = await getAllProducts();
    return NextResponse.json(products);
}, null, true);

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
}), true);
