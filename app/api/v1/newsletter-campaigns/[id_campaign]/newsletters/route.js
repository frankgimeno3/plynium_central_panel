import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNewslettersByCampaign } from "../../../../../../server/features/newsletter/NewsletterDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request, body, params) => {
    const list = await getNewslettersByCampaign(params.id_campaign);
    return NextResponse.json(list);
  },
  null,
  true,
  []
);
