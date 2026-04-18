import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  deleteNewsletterCampaign,
  updateNewsletterCampaign,
} from "../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

const putSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().allow("").optional(),
  newsletterType: Joi.string().valid("main", "specific").optional(),
  contentTheme: Joi.string().allow("").max(255).optional(),
  frequency: Joi.string().min(1).max(255).optional(),
  status: Joi.string().min(1).max(255).optional(),
});

export const PUT = createEndpoint(
  async (request, body, params) => {
    const patch = {
      name: body.name,
      description: body.description,
      newsletterType: body.newsletterType,
      contentTheme: body.contentTheme,
      frequency: body.frequency,
      status: body.status,
    };
    const updated = await updateNewsletterCampaign(params.id_campaign, patch);
    return NextResponse.json(updated);
  },
  putSchema,
  true,
  []
);

const deleteSchema = Joi.object({
  confirm: Joi.string().valid("true").required(),
});

export const DELETE = createEndpoint(
  async (request, body, params) => {
    await deleteNewsletterCampaign(params.id_campaign);
    return NextResponse.json({ ok: true });
  },
  deleteSchema,
  true,
  []
);

