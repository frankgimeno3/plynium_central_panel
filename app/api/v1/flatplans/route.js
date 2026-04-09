import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getAllFlatplans, createFlatplan } from "../../../../server/features/publication_workflow/PublicationWorkflowService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(async () => {
    const flatplans = await getAllFlatplans();
    return NextResponse.json(flatplans);
}, null, true);

const postFlatplanSchema = Joi.object({
    id_flatplan: Joi.string().trim().min(1).max(64).required(),
    id_magazine: Joi.string().trim().min(1).max(64).required(),
    year: Joi.number().integer().required(),
    issue_number: Joi.number().integer().required(),
    edition_name: Joi.string().allow("").max(512).optional(),
    theme: Joi.string().allow("").max(512).optional(),
    publication_date: Joi.string().allow(null, "").optional(),
    description: Joi.string().allow("").optional(),
});

export const POST = createEndpoint(
    async (_request, body) => {
        const created = await createFlatplan(body);
        return NextResponse.json(created, { status: 201 });
    },
    postFlatplanSchema,
    true
);
