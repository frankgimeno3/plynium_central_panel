import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getArticleById } from "../../../../../../server/features/article/ArticleService.js";
import {
    getPublicationsByArticleId,
    addArticleToPortal,
} from "../../../../../../server/features/article/ArticlePublicationService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/articles\/([^/]+)\/publications/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    throw new Error("Article ID not found in URL");
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const list = await getPublicationsByArticleId(id);
    return NextResponse.json(list);
}, null, true);

const postSchema = Joi.object({
    portalId: Joi.number().integer().min(1).required(),
});

export const POST = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const article = await getArticleById(id);
    const list = await addArticleToPortal(id, body.portalId, article?.articleTitle ?? "");
    return NextResponse.json(list);
}, postSchema, true);
