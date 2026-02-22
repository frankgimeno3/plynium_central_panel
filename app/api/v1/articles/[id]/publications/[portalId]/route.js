import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { removeArticleFromPortal } from "../../../../../../../server/features/article/ArticlePublicationService.js";

export const runtime = "nodejs";

function getIdsFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/articles\/([^/]+)\/publications\/([^/]+)/);
    if (match && match[1] && match[2]) {
        return { articleId: decodeURIComponent(match[1]), portalId: parseInt(match[2], 10) };
    }
    throw new Error("Article ID or Portal ID not found in URL");
}

export const DELETE = createEndpoint(async (request) => {
    const { articleId, portalId } = getIdsFromRequest(request);
    if (!Number.isInteger(portalId) || portalId < 1) {
        return NextResponse.json({ error: "Invalid portal ID" }, { status: 400 });
    }
    const list = await removeArticleFromPortal(articleId, portalId);
    return NextResponse.json(list);
}, null, true);
