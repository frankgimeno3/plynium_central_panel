import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getServiceGroupById } from "../../../../../server/features/service_db/ServiceGroupDbService.js";

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
