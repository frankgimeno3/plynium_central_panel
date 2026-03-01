import { createEndpoint } from "@/server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
    getHighlightedArticlesByPortal,
    getHighlightPositions,
    setHighlightedArticleForPosition,
} from "@/server/features/article/ArticlePublicationService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getPortalIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/portals\/(\d+)\/highlighted-articles/);
    if (match && match[1]) return parseInt(match[1], 10);
    throw new Error("Portal ID not found");
}

export const GET = createEndpoint(
    async (request) => {
        const portalId = getPortalIdFromRequest(request);
        const [highlighted, positions] = await Promise.all([
            getHighlightedArticlesByPortal(portalId),
            Promise.resolve(getHighlightPositions()),
        ]);
        const byPos = new Map(highlighted.map((h) => [h.highlightPosition, h]));
        const rows = positions.map((pos) => ({
            highlightPosition: pos,
            articleId: byPos.get(pos)?.articleId ?? "",
            articleTitle: byPos.get(pos)?.articleTitle ?? "",
            article_main_image_url: byPos.get(pos)?.article_main_image_url ?? "",
        }));
        return NextResponse.json(rows);
    },
    null,
    true
);

const putSchema = Joi.object({
    highlightPosition: Joi.string().required(),
    articleId: Joi.string().required(),
});

export const PUT = createEndpoint(
    async (request, body) => {
        const portalId = getPortalIdFromRequest(request);
        await setHighlightedArticleForPosition(portalId, body.highlightPosition, body.articleId);
        const [highlighted, positions] = await Promise.all([
            getHighlightedArticlesByPortal(portalId),
            Promise.resolve(getHighlightPositions()),
        ]);
        const byPos = new Map(highlighted.map((h) => [h.highlightPosition, h]));
        const rows = positions.map((pos) => ({
            highlightPosition: pos,
            articleId: byPos.get(pos)?.articleId ?? "",
            articleTitle: byPos.get(pos)?.articleTitle ?? "",
            article_main_image_url: byPos.get(pos)?.article_main_image_url ?? "",
        }));
        return NextResponse.json(rows);
    },
    putSchema,
    true
);
