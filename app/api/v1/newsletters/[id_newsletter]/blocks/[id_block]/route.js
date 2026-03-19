import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { updateNewsletterContentBlock } from "../../../../../../../server/features/newsletter/NewsletterDbService.js";
import Joi from "joi";

export const runtime = "nodejs";

const putSchema = Joi.object({
  block_type: Joi.string().required(),
  block_order: Joi.number().integer().min(0).required(),
  data: Joi.object().required(),
});

export const PUT = createEndpoint(
  async (request, body, params) => {
    const updated = await updateNewsletterContentBlock(params.id_newsletter, params.id_block, {
      blockType: body.block_type,
      order: body.block_order,
      data: body.data,
    });
    return NextResponse.json(updated);
  },
  putSchema,
  true,
  []
);

