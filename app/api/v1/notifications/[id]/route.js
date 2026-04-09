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
    notification_category: Joi.string().allow(null).optional(),
    brief_description: Joi.string().allow("").optional(),
    description: Joi.string().allow("").optional(),
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
        descripcion_empresa: Joi.string().allow("").optional()
    }).allow(null).optional(),
    add_comment: Joi.string().allow("").optional()
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
