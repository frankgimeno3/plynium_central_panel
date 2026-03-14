import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { createPresign } from "../../../../../server/features/media/MediaService.js";
import Joi from "joi";

export const runtime = "nodejs";

const postSchema = Joi.object({
    filename: Joi.string().required(),
    contentType: Joi.string().optional().allow(""),
});

export const POST = createEndpoint(
    async (request, body) => {
        const result = await createPresign(body);
        return NextResponse.json(result);
    },
    postSchema,
    true
);
