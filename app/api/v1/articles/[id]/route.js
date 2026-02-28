import {createEndpoint} from "../../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getArticleById, updateArticle, deleteArticle} from "../../../../../server/features/article/ArticleService.js";
import Joi from "joi";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    // URL format: /api/v1/articles/{id}
    const match = url.pathname.match(/\/api\/v1\/articles\/([^\/]+)/);
    if (match && match[1]) {
        return decodeURIComponent(match[1]);
    }
    throw new Error('Article ID not found in URL');
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const article = await getArticleById(id);
    return NextResponse.json(article);
}, null, true);

export const PUT = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const article = await updateArticle(id, body);
    return NextResponse.json(article);
}, Joi.object({
    articleTitle: Joi.string().optional(),
    articleSubtitle: Joi.string().optional(),
    article_main_image_url: Joi.string().optional(),
    company: Joi.string().optional(),
    date: Joi.string().optional(),
    article_tags_array: Joi.array().items(Joi.string()).optional(),
    contents_array: Joi.array().items(Joi.string()).optional(),
    highlited_position: Joi.string().allow("").optional(),
    portalId: Joi.number().integer().optional(),
    is_article_event: Joi.boolean().optional(),
    event_id: Joi.string().allow("").optional()
}), true);

export const DELETE = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const article = await deleteArticle(id);
    return NextResponse.json(article);
}, null, true);

