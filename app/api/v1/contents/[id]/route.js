import {createEndpoint} from "../../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getContentById, updateContent, deleteContent} from "../../../../../server/features/content/ContentService.js";
import Joi from "joi";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    // URL format: /api/v1/contents/{id}
    const match = url.pathname.match(/\/api\/v1\/contents\/([^\/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error('Content ID not found in URL');
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const content = await getContentById(id);
    return NextResponse.json(content);
}, null, true);

export const PUT = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const content = await updateContent(id, body);
    return NextResponse.json(content);
}, Joi.object({
    content_type: Joi.string().optional(),
    content_content: Joi.object({
        left: Joi.alternatives().try(Joi.string(), Joi.valid("no")).optional(),
        right: Joi.alternatives().try(Joi.string(), Joi.valid("no")).optional(),
        center: Joi.alternatives().try(Joi.string(), Joi.valid("no")).optional()
    }).optional()
}), true);

export const DELETE = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const content = await deleteContent(id);
    return NextResponse.json(content);
}, null, true);

