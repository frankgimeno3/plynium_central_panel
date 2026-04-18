import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  getNewslettersByCampaignAndPortal,
  removeNewsletterCampaignPortal,
} from "../../../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async (request, body, params) => {
    const list = await getNewslettersByCampaignAndPortal(params.id_campaign, params.portal_id);
    return NextResponse.json(list);
  },
  null,
  true,
  []
);

const deleteSchema = Joi.object({
  confirm: Joi.string().valid("true").required(),
});

export const DELETE = createEndpoint(
  async (request, body, params) => {
    // `createEndpoint` valida DELETE usando querystring; pedimos confirm=true
    await removeNewsletterCampaignPortal(params.id_campaign, params.portal_id);
    return NextResponse.json({ ok: true });
  },
  deleteSchema,
  true,
  []
);

