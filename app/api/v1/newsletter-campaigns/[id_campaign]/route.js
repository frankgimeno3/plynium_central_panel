import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  deleteNewsletterCampaign,
  updateNewsletterCampaign,
} from "../../../../../server/features/newsletter/NewsletterDbService.js";
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

const putSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().allow("").optional(),
  newsletterType: Joi.string().valid("main", "specific").optional(),
  contentTheme: Joi.string().allow("").max(255).optional(),
  frequency: Joi.string().min(1).max(255).optional(),
  status: Joi.string().min(1).max(255).optional(),
  layoutConfig: layoutConfigSchema,
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
      layoutConfig: body.layoutConfig,
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

