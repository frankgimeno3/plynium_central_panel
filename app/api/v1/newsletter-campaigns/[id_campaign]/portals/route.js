import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  addNewsletterCampaignPortals,
  getNewsletterCampaignPortals,
} from "../../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request, body, params) => {
    const portals = await getNewsletterCampaignPortals(params.id_campaign);
    return NextResponse.json(portals);
  },
  null,
  true,
  []
);

const postSchema = Joi.object({
  portalIds: Joi.array().items(Joi.number().integer()).min(1).required(),
});

export const POST = createEndpoint(
  async (request, body, params) => {
    const portals = await addNewsletterCampaignPortals(params.id_campaign, body.portalIds);
    return NextResponse.json(portals);
  },
  postSchema,
  true,
  []
);

