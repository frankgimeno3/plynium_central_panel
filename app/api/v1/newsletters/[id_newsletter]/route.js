import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNewsletterById, updateNewsletterStatus } from "../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

const statusSchema = Joi.object({
  status: Joi.string().valid("calendarized", "pending", "published", "cancelled").optional(),
  userNewsletterListId: Joi.string().optional().allow(null),
});

export const GET = createEndpoint(
  async (request, body, params) => {
    const newsletter = await getNewsletterById(params.id_newsletter);
    if (!newsletter) return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
    return NextResponse.json(newsletter);
  },
  null,
  true,
  []
);

export const PUT = createEndpoint(
  async (request, body, params) => {
    const newsletter = await updateNewsletterStatus(params.id_newsletter, {
      status: body.status,
      userNewsletterListId: body.userNewsletterListId,
    });
    return NextResponse.json(newsletter);
  },
  statusSchema,
  true,
  []
);

