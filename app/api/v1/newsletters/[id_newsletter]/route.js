import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getNewsletterById, updateNewsletter } from "../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

const layoutConfigSchema = Joi.object({
  newsletterType: Joi.string().valid("main", "specific", "magazine").optional(),
  magazineHeaderMode: Joi.string()
    .valid("magazine_as_header", "normal_header_and_magazine_in_content")
    .optional(),
  headerBackground: Joi.string().allow("").optional(),
  headerLogoLabel: Joi.string().allow("").optional(),
  headerTextRight: Joi.string().allow("").optional(),
  headerSubtitle: Joi.string().allow("").optional(),
  headerTextColor: Joi.string().allow("").optional(),
  magazinePortalId: Joi.string().allow("").optional(),
  magazineId: Joi.string().allow("").optional(),
  magazinePublicationId: Joi.string().allow("").optional(),
  magazineContentBackground: Joi.string().allow("").optional(),
  magazineContentTextColor: Joi.string().allow("").optional(),
  summaryBackground: Joi.string().allow("").optional(),
  summaryTextColor: Joi.string().allow("").optional(),
  contentSectionBackground: Joi.string().allow("").optional(),
  titleFont: Joi.string().allow("").optional(),
  subtitleFont: Joi.string().allow("").optional(),
  titleTextColor: Joi.string().allow("").optional(),
  subtitleTextColor: Joi.string().allow("").optional(),
  buttonColor: Joi.string().allow("").optional(),
  buttonTextColor: Joi.string().allow("").optional(),
  footerColor: Joi.string().allow("").optional(),
  footerTextColor: Joi.string().allow("").optional(),
  footerContactEmail: Joi.string().allow("").optional(),
  footerLinkedinLink: Joi.string().allow("").optional(),
  footerWebsite: Joi.string().allow("").optional(),
  footerContactPhone: Joi.string().allow("").optional(),
  footerUnsubscribeEmail: Joi.string().allow("").optional(),
}).optional();

const updateSchema = Joi.object({
  status: Joi.string().valid("calendarized", "pending", "published", "cancelled").optional(),
  topic: Joi.string().allow("").optional(),
  estimatedPublishDate: Joi.string().allow("", null).optional(),
  userNewsletterListIds: Joi.array().items(Joi.string().trim()).optional(),
  userNewsletterListId: Joi.string().optional().allow(null),
  layoutEditionConfig: layoutConfigSchema.allow(null),
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
    const newsletter = await updateNewsletter(params.id_newsletter, {
      status: body.status,
      topic: body.topic,
      estimatedPublishDate: body.estimatedPublishDate,
      userNewsletterListIds: body.userNewsletterListIds,
      userNewsletterListId: body.userNewsletterListId,
      layoutEditionConfig: body.layoutEditionConfig,
    });
    return NextResponse.json(newsletter);
  },
  updateSchema,
  true,
  []
);

