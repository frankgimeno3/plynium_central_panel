import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNewsletterCampaigns } from "../../../../server/features/newsletter/NewsletterDbService.js";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
  const campaigns = await getNewsletterCampaigns();
  return NextResponse.json(campaigns);
}, null, true, []);

