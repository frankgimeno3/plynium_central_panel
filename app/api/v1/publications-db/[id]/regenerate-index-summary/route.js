/**
 * Manually rebuild `index.pdf` and `summary.pdf` for one publication.
 *
 * This is normally triggered automatically (see PublicationIndexSummaryService),
 * but the endpoint is useful for backfilling existing publications, debugging,
 * or rebuilding after Mediateca-level changes.
 */

import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  regeneratePublicationIndexAndSummary,
} from "../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

export const POST = createEndpoint(
  async (_request, _body, params) => {
    const publicationId = params?.id;
    if (!publicationId) {
      return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    }
    try {
      const result = await regeneratePublicationIndexAndSummary(String(publicationId));
      if (!result) {
        return NextResponse.json(
          { message: "Publication not found or DB not configured" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        publication_id: String(publicationId),
        ...result,
      });
    } catch (err) {
      console.error("[regenerate-index-summary] failed:", err);
      return NextResponse.json(
        { message: err?.message ?? "Failed to regenerate index/summary PDFs" },
        { status: 500 }
      );
    }
  },
  null,
  true
);
