import {createEndpoint} from "../../../../server/createEndpoint.js";
import {NextResponse} from "next/server";
import {getAllContents, createContent} from "../../../../server/features/content/ContentService.js";
import Joi from "joi";

// Ensure Node.js runtime (not Edge) for database connections
export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const contents = await getAllContents();
    return NextResponse.json(contents);
}, null, true);

export const POST = createEndpoint(async (request, body) => {
    const content = await createContent(body);
    return NextResponse.json(content);
}, Joi.object({
    content_id: Joi.string().required(),
    content_type: Joi.string().required(),
    content_content: Joi.object({
        left: Joi.alternatives().try(Joi.string(), Joi.valid("no")).required(),
        right: Joi.alternatives().try(Joi.string(), Joi.valid("no")).required(),
        center: Joi.alternatives().try(Joi.string(), Joi.valid("no")).required()
    }).required()
}), true);

