/**
 * Remove orphaned article page screenshots after pages are deleted or renumbered.
 */

import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationArticleDbModel,
  PublicationModel,
} from "../../../../../../../server/database/models.js";
import "../../../../../../../server/database/models.js";
import { pruneArticleScreenshotsBeyondPageCount } from "../../../../../../../server/features/publication/ArticleScreenshotService.js";

export const runtime = "nodejs";

const postSchema = Joi.object({
  page_count: Joi.number().integer().min(0).required(),
});

function getPublicationArticleIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(
    /\/api\/v1\/publication-articles\/([^/]+)\/screenshots\/prune/
  );
  if (match?.[1]) return decodeURIComponent(match[1]);
  throw new Error("publication_article_id not found in URL");
}

export const POST = createEndpoint(
  async (request, body) => {
    const publicationArticleId = getPublicationArticleIdFromRequest(request);
    const pageCount = Number(body.page_count);

    const article = await PublicationArticleDbModel.findByPk(publicationArticleId);
    if (!article) {
      return NextResponse.json({ message: "Publication article not found" }, { status: 404 });
    }

    const ap = article.get({ plain: true });
    const publicationId = String(ap.publication_id ?? "").trim();
    const networkArticleId = String(ap.article_id ?? "").trim();
    if (!publicationId || !networkArticleId) {
      return NextResponse.json({ message: "Missing publication or article id" }, { status: 400 });
    }

    const publication = await PublicationModel.findByPk(publicationId);
    if (!publication) {
      return NextResponse.json({ message: "Publication not found" }, { status: 404 });
    }

    const deletedCount = await pruneArticleScreenshotsBeyondPageCount(
      publication,
      networkArticleId,
      pageCount
    );

    return NextResponse.json({
      publication_article_id: publicationArticleId,
      page_count: pageCount,
      deleted_screenshot_count: deletedCount,
    });
  },
  postSchema,
  true
);
