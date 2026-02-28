import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getPublicationById } from "../../../../../../server/features/publication/PublicationService.js";
import {
    getPortalsByPublicationId,
    addPublicationToPortal,
} from "../../../../../../server/features/publication/PublicationPortalService.js";
import Joi from "joi";

export const runtime = "nodejs";

function getIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/publications\/([^/]+)\/portals/);
    if (match && match[1]) return decodeURIComponent(match[1]);
    throw new Error("Publication ID not found in URL");
}

export const GET = createEndpoint(async (request) => {
    const id = getIdFromRequest(request);
    const list = await getPortalsByPublicationId(id);
    return NextResponse.json(list);
}, null, true);

const postSchema = Joi.object({
    portalId: Joi.number().integer().min(1).required(),
});

export const POST = createEndpoint(async (request, body) => {
    const id = getIdFromRequest(request);
    const publication = await getPublicationById(id);
    const list = await addPublicationToPortal(
        id,
        body.portalId,
        publication?.redirectionLink ?? "",
        id
    );
    return NextResponse.json(list);
}, postSchema, true);
