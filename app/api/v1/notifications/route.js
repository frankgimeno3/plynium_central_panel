import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllNotifications, createNotification } from "../../../../server/features/notification_db/NotificationDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

const ticketTypeValues = [
    "account_management",
    "production",
    "administration",
    "advertisement",
    "company",
    "product",
    "other",
    "notification"
];

const getSchema = Joi.object({
    notification_type: Joi.string().valid(...ticketTypeValues).optional(),
    notification_category: Joi.string().valid("account_management", "production", "administration").optional(),
    state: Joi.string().optional()
});

export const GET = createEndpoint(async (request, body) => {
    const filters = {};
    if (body?.notification_type) filters.notification_type = body.notification_type;
    if (body?.notification_category) filters.notification_category = body.notification_category;
    if (body?.state) filters.state = body.state;
    
    const notifications = await getAllNotifications(filters);
    return NextResponse.json(notifications);
}, getSchema, true);

const postSchema = Joi.object({
    id: Joi.string().required(),
    notification_type: Joi.string().valid(...ticketTypeValues).required(),
    notification_category: Joi.string().valid("account_management", "production", "administration").allow(null).optional(),
    state: Joi.string().optional(),
    date: Joi.string().allow("").optional(),
    brief_description: Joi.string().allow("").optional(),
    description: Joi.string().allow("").optional(),
    interest: Joi.string().allow("").optional(),
    services_array: Joi.array().items(Joi.string()).optional(),
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
    sender_email: Joi.string().allow("").optional(),
    sender_company: Joi.string().allow("").optional(),
    sender_contact_phone: Joi.string().allow("").optional(),
    country: Joi.string().allow("").optional(),
    user_id: Joi.string().allow("").optional(),
    company_content: Joi.object({
        nombre_comercial: Joi.string().allow("").optional(),
        nombre_fiscal: Joi.string().allow("").optional(),
        tax_id: Joi.string().allow("").optional(),
        cargo_creador: Joi.string().allow("").optional(),
        web_empresa: Joi.string().allow("").optional(),
        pais_empresa: Joi.string().allow("").optional(),
        descripcion_empresa: Joi.string().allow("").optional()
    }).allow(null).optional()
});

export const POST = createEndpoint(async (request, body) => {
    const notification = await createNotification(body);
    return NextResponse.json(notification);
}, postSchema, true);
