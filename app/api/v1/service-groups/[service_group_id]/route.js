import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    getServiceGroupById,
    updateServiceGroup,
} from "../../../../../server/features/service_db/ServiceGroupDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/service-groups\/([^/]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    throw new Error("service_group_id not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const service_group_id = getIdFromRequest(request);
        try {
            const group = await getServiceGroupById(service_group_id);
            return NextResponse.json(group);
        } catch (err) {
            if (err.message && err.message.includes("not found")) {
                return NextResponse.json({ message: "Service group not found" }, { status: 404 });
            }
            throw err;
        }
    },
    null,
    true
);

const patchSchema = Joi.object({
    service_group_name: Joi.string().trim().min(1).max(255).optional(),
    service_group_channel: Joi.string().valid("dem", "portal", "magazine").optional(),
    tariff_price_eur: Joi.number().min(0).optional(),
    service_specifications: Joi.string().allow("").optional(),
    service_base_description: Joi.string().allow("").optional(),
})
    .min(1)
    .unknown(false);

export const PATCH = createEndpoint(
    async (request, body) => {
        const service_group_id = getIdFromRequest(request);
        try {
            const updated = await updateServiceGroup(service_group_id, {
                service_group_name: body.service_group_name,
                service_group_channel: body.service_group_channel,
                tariff_price_eur: body.tariff_price_eur,
                service_specifications: body.service_specifications,
                service_base_description: body.service_base_description,
            });
            return NextResponse.json(updated);
        } catch (err) {
            const msg = err?.message ?? "";
            if (msg.includes("not found")) {
                return NextResponse.json({ message: "Service group not found" }, { status: 404 });
            }
            if (msg.includes("required")) {
                return NextResponse.json({ message: msg }, { status: 400 });
            }
            if (msg.includes("already exists")) {
                return NextResponse.json({ message: msg }, { status: 409 });
            }
            throw err;
        }
    },
    patchSchema,
    true
);
