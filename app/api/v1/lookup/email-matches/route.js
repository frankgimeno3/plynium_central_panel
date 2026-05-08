import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { findEntitiesByEmail } from "../../../../../server/features/email_lookup/EmailLookupService.js";

export const runtime = "nodejs";

const querySchema = Joi.object({
    email: Joi.string().trim().email().required(),
});

export const GET = createEndpoint(
    async (_request, body) => {
        const email = String(body?.email ?? "").trim();
        const data = await findEntitiesByEmail(email);
        return NextResponse.json({ email, ...data });
    },
    querySchema,
    true
);
