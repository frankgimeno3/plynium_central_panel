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
    tariff_price_eur: Joi.number().min(0).optional(),
    service_specifications: Joi.string().allow("").optional(),
    service_base_description: Joi.string().allow("").optional(),
}).unknown(false);

export const POST = createEndpoint(
    async (_request, body) => {
        try {
            const created = await createServiceGroup({
                service_group_name: body.service_group_name,
                service_group_channel: body.service_group_channel,
                tariff_price_eur: body.tariff_price_eur,
                service_specifications: body.service_specifications,
                service_base_description: body.service_base_description,
            });
            return NextResponse.json(created);
        } catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("required")) {
                return NextResponse.json({ message: msg }, { status: 400 });
            }
            if (msg.includes("already exists")) {
                return NextResponse.json({ message: msg }, { status: 409 });
            }
            throw err;
        }
    },
    postSchema,
    true
);
