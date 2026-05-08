import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { deleteRelation } from "../../../../../server/features/customer_company_relation/CustomerCompanyRelationService.js";

export const runtime = "nodejs";

function getRelationIdFromRequest(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/\/api\/v1\/customer-company-relations\/([^/]+)/);
    if (m && m[1]) return decodeURIComponent(m[1]);
    throw new Error("relation_id not found in URL");
}

export const DELETE = createEndpoint(
    async (request) => {
        const id = getRelationIdFromRequest(request);
        try {
            const out = await deleteRelation(id);
            return NextResponse.json(out);
        } catch (err) {
            if (err && String(err.message || "").includes("not found")) {
                return NextResponse.json({ message: "Relation not found" }, { status: 404 });
            }
            throw err;
        }
    },
    null,
    true
);
