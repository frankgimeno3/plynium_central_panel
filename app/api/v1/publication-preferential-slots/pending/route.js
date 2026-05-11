import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { listPendingPublicationPreferentialSlots } from "../../../../../server/features/publication/PublicationPreferentialSlotInventoryService.js";

export const runtime = "nodejs";

const getSchema = Joi.object({
    portal_id: Joi.number().integer().optional(),
    magazine_id: Joi.string().optional(),
    publication_id: Joi.string().optional(),
    publication_name: Joi.string().optional(),
    service_group_id: Joi.string().uuid().optional(),
    customer_id: Joi.string().optional(),
});

export const GET = createEndpoint(
    async (_request, query) => {
        const data = await listPendingPublicationPreferentialSlots({
            portal_id: query?.portal_id,
            magazine_id: query?.magazine_id,
            publication_id: query?.publication_id,
            publication_name: query?.publication_name,
            service_group_id: query?.service_group_id,
            customer_id: query?.customer_id,
        });
        return NextResponse.json(data);
    },
    getSchema,
    true
);
