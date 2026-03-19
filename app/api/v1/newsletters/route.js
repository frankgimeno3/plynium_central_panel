import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNewsletters, createNewsletter } from "../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
  const newsletters = await getNewsletters();
  return NextResponse.json(newsletters);
}, null, true, []);

const postSchema = Joi.object({
  id_newsletter: Joi.string().required(),
  id_campaign: Joi.string().required(),
  portal_code: Joi.string().required(),
  estimated_publish_date: Joi.date().optional().allow(null),
  topic: Joi.string().optional().allow(""),
  status: Joi.string()
    .valid("calendarized", "pending", "published", "cancelled")
    .required(),
  user_newsletter_list_id: Joi.string().optional().allow(null),
});

export const POST = createEndpoint(
  async (request, body) => {
    const created = await createNewsletter(body.id_newsletter, {
      idCampaign: body.id_campaign,
      portalCode: body.portal_code,
      estimatedPublishDate: body.estimated_publish_date ? new Date(body.estimated_publish_date) : null,
      topic: body.topic,
      status: body.status,
      userNewsletterListId: body.user_newsletter_list_id,
    });
    return NextResponse.json(created);
  },
  postSchema,
  true,
  []
);

