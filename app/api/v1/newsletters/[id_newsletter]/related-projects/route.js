import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { listRelatedProjectsForNewsletter } from "../../../../../../server/features/newsletter/NewsletterDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request, body, params) => {
    const items = await listRelatedProjectsForNewsletter(params.id_newsletter);
    return NextResponse.json({ items });
  },
  null,
  true,
  []
);
