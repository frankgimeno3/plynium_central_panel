import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    listRelationsByCompany,
    listRelationsByCustomer,
    createRelation,
} from "../../../../server/features/customer_company_relation/CustomerCompanyRelationService.js";

export const runtime = "nodejs";

const getQuerySchema = Joi.object({
    companyId: Joi.string().trim().min(1),
    customerId: Joi.string().trim().min(1),
})
    .xor("companyId", "customerId")
    .messages({
        "object.missing": "Provide companyId or customerId",
        "object.xor": "Provide only one of companyId or customerId",
    });

const postBodySchema = Joi.object({
    customer_id: Joi.string().trim().required(),
    company_id: Joi.string().trim().required(),
});

export const GET = createEndpoint(
    async (_request, body) => {
        const companyId = String(body?.companyId ?? "").trim();
        const customerId = String(body?.customerId ?? "").trim();
        if (companyId) {
            const list = await listRelationsByCompany(companyId);
            return NextResponse.json(list);
        }
        const list = await listRelationsByCustomer(customerId);
        return NextResponse.json(list);
    },
    getQuerySchema,
    true
);

export const POST = createEndpoint(
    async (request, body) => {
        const rel = await createRelation(body.customer_id, body.company_id);
        return NextResponse.json(rel, { status: 201 });
    },
    postBodySchema,
    true
);
