import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  createNewsletterCampaign,
  getNewsletterCampaigns,
} from "../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

const postSchema = Joi.object({
  id: Joi.string().min(1).max(255).required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow("").optional(),
  portalCode: Joi.string().min(1).max(255).required(),
  newsletterType: Joi.string().valid("main", "specific").optional(),
  contentTheme: Joi.string().allow("").max(255).optional(),
  frequency: Joi.string().min(1).max(255).required(),
  status: Joi.string().min(1).max(255).optional(),
});

export const GET = createEndpoint(async () => {
  const campaigns = await getNewsletterCampaigns();
  return NextResponse.json(campaigns);
}, null, true, []);

export const POST = createEndpoint(
  async (_request, body) => {
    const created = await createNewsletterCampaign(body.id, {
      name: body.name,
      description: body.description,
      portalCode: body.portalCode,
      newsletterType: body.newsletterType,
      contentTheme: body.contentTheme,
      frequency: body.frequency,
      status: body.status,
    });
    return NextResponse.json(created, { status: 201 });
  },
  postSchema,
  true,
  []
);

