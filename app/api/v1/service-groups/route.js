import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    createServiceGroup,
    getAllServiceGroups,
} from "../../../../server/features/service_db/ServiceGroupDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
    async () => {
        const list = await getAllServiceGroups();
        return NextResponse.json(list);
    },
    null,
    true
);

const postSchema = Joi.object({
    service_group_name: Joi.string().trim().min(1).max(255).required(),
    service_group_channel: Joi.string().valid("dem", "portal", "magazine").required(),
}).unknown(false);

export const POST = createEndpoint(
    async (_request, body) => {
        try {
            const created = await createServiceGroup({
                service_group_name: body.service_group_name,
                service_group_channel: body.service_group_channel,
            });
            return NextResponse.json(created);
        } catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("required")) {
                return NextResponse.json({ message: msg }, { status: 400 });
            }
            throw err;
        }
    },
    postSchema,
    true
);
