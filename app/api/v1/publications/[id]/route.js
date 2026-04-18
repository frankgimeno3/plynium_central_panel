import {createEndpoint} from "../../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getPublicationById, updatePublication, deletePublication} from "../../../../../server/features/publication/PublicationService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    // URL format: /api/v1/publications/{id}
    const match = url.pathname.match(/\/api\/v1\/publications\/([^\/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error('Publication ID not found in URL');
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const publication = await getPublicationById(id);
    return NextResponse.json(publication);
}, null, true);

export const PUT = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const publication = await updatePublication(id, body);
    return NextResponse.json(publication);
}, Joi.object({
    redirectionLink: Joi.string().optional(),
    date: Joi.string().optional(),
    revista: Joi.string().optional(),
    número: Joi.string().optional(),
    publication_main_image_url: Joi.string().optional().allow(""),
    publication_theme: Joi.string().allow("").optional(),
    publication_expected_publication_month: Joi.number().integer().min(1).max(12).allow(null).optional(),
    publication_year: Joi.number().integer().optional(),
    magazine_this_year_issue: Joi.number().integer().optional(),
    magazine_general_issue_number: Joi.number().integer().allow(null).optional(),
    publication_edition_name: Joi.string().allow("").optional(),
    is_special_edition: Joi.boolean().optional(),
    publication_status: Joi.string().optional(),
    publication_format: Joi.string().valid("informer", "flipbook", "both").optional(),
    real_publication_month_date: Joi.string().allow(null, "").optional(),
}), true);

export const DELETE = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const publication = await deletePublication(id);
    return NextResponse.json(publication);
}, null, true);

