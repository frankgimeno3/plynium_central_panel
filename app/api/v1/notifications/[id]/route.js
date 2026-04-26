import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNotificationById, updateNotification, deleteNotification, addComment } from "../../../../../server/features/notification_db/NotificationDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(async (request, body, params) => {
    const notification = await getNotificationById(params.id);
    return NextResponse.json(notification);
}, null, true);

const putSchema = Joi.object({
    state: Joi.string().optional(),
    notification_type: Joi.string().optional(),
    brief_description: Joi.string().allow("").optional(),
    description: Joi.string().allow("").optional(),
    interest: Joi.string().allow("").optional(),
    sender_email: Joi.string().allow("").optional(),
    sender_company: Joi.string().allow("").optional(),
    sender_contact_phone: Joi.string().allow("").optional(),
    country: Joi.string().allow("").optional(),
    company_content: Joi.object({
        nombre_comercial: Joi.string().allow("").optional(),
        nombre_fiscal: Joi.string().allow("").optional(),
        tax_id: Joi.string().allow("").optional(),
        cargo_creador: Joi.string().allow("").optional(),
        web_empresa: Joi.string().allow("").optional(),
        pais_empresa: Joi.string().allow("").optional(),
        descripcion_empresa: Joi.string().allow("").optional(),
        list_as_employee: Joi.boolean().optional()
    }).allow(null).optional(),
    product_content: Joi.object({
        product_name: Joi.string().allow("").optional(),
        product_description: Joi.string().allow("").optional(),
        product_price: Joi.number().min(0).optional(),
        company_id: Joi.string().allow("").optional(),
        product_main_image_src: Joi.string().allow("").max(2048).optional(),
        product_categories_array: Joi.array().items(Joi.string().trim()).optional()
    }).allow(null).optional(),
    advertisement_request: Joi.object({
        contact_full_name: Joi.string().allow("").optional(),
        contact_email: Joi.string().allow("").optional(),
        company_country: Joi.string().allow("").optional(),
        phone_country_prefix: Joi.string().allow("").optional(),
        phone_number: Joi.string().allow("").optional(),
        interest: Joi.string().allow("").optional(),
        message: Joi.string().allow("").optional(),
        terms_accepted: Joi.boolean().optional(),
        services_array: Joi.array().items(Joi.string()).optional()
    }).allow(null).optional(),
    add_comment: Joi.string().allow("").optional(),
    /** When resolving a company directory ticket, single portal (legacy). */
    fulfill_portal_id: Joi.number().integer().min(1).optional(),
    /** One or more portals: `company_portals` rows and matching `user_notifications` per portal. */
    fulfill_portal_ids: Joi.array().items(Joi.number().integer().min(1)).min(1).optional(),
    /** When approving a product ticket: create product + portals + notifications. */
    fulfill_product: Joi.boolean().optional()
});

export const PUT = createEndpoint(async (request, body, params) => {
    if (body.add_comment) {
        const notification = await addComment(params.id, body.add_comment, request?.sub ?? null);
        return NextResponse.json(notification);
    }
    
    const notification = await updateNotification(params.id, body);
    return NextResponse.json(notification);
}, putSchema, true);

export const DELETE = createEndpoint(async (request, body, params) => {
    const notification = await deleteNotification(params.id);
    return NextResponse.json(notification);
}, null, true);
