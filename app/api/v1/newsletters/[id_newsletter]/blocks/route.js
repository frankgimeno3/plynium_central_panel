import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import {
  createNewsletterContentBlocks,
  getNewsletterBlocks,
  reorderNewsletterContentBlocks,
} from "../../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

const blockSchema = Joi.object({
  id: Joi.string().min(1).max(255).required(),
  blockType: Joi.string()
    .valid("banner", "portal_article_preview", "header", "footer", "custom_content")
    .required(),
  order: Joi.number().integer().min(0).required(),
  data: Joi.object().unknown(true).required(),
});

const postSchema = Joi.object({
  blocks: Joi.array().items(blockSchema).min(1).required(),
});

const putSchema = Joi.object({
  orderedBlockIds: Joi.array().items(Joi.string().min(1).max(255)).min(1).required(),
});

export const GET = createEndpoint(
  async (request, body, params) => {
    const blocks = await getNewsletterBlocks(params.id_newsletter);
    return NextResponse.json(blocks);
  },
  null,
  true,
  []
);

export const POST = createEndpoint(
  async (request, body, params) => {
    const blocks = await createNewsletterContentBlocks(params.id_newsletter, body.blocks);
    return NextResponse.json(blocks, { status: 201 });
  },
  postSchema,
  true,
  []
);

export const PUT = createEndpoint(
  async (request, body, params) => {
    const blocks = await reorderNewsletterContentBlocks(params.id_newsletter, body.orderedBlockIds);
    return NextResponse.json(blocks);
  },
  putSchema,
  true,
  []
);
