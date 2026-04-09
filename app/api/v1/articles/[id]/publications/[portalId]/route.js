import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
    removeArticleFromPortal,
    updateArticlePortalPublication,
} from "../../../../../../../server/features/article/ArticlePublicationService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getIdsFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/articles\/([^/]+)\/publications\/([^/]+)/);
    if (match && match[1] && match[2]) {
        return { articleId: decodeURIComponent(match[1]), portalId: parseInt(match[2], 10) };
    }
    throw new Error("Article ID or Portal ID not found in URL");
}

const patchPublicationSchema = Joi.object({
    visibility: Joi.string().trim().min(1).max(128).optional(),
    commentingEnabled: Joi.boolean().optional(),
})
    .or("visibility", "commentingEnabled")
    .messages({
        "object.missing": "Provide visibility and/or commentingEnabled",
    });

export const PATCH = createEndpoint(async (request, body) => {
    const { articleId, portalId } = getIdsFromRequest(request);
    if (!Number.isInteger(portalId) || portalId < 1) {
        return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });
    }
    const list = await updateArticlePortalPublication(articleId, portalId, {
        visibility: body.visibility,
        commentingEnabled: body.commentingEnabled,
    });
    return NextResponse.json(list);
}, patchPublicationSchema, true);

export const DELETE = createEndpoint(async (request) => {
    const { articleId, portalId } = getIdsFromRequest(request);
    if (!Number.isInteger(portalId) || portalId < 1) {
        return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });
    }
    const list = await removeArticleFromPortal(articleId, portalId);
    return NextResponse.json(list);
}, null, true);
