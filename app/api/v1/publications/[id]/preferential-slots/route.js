import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    listPreferentialSlotsForPublication,
} from "../../../../../../server/features/publication/PublicationPreferentialSlotReservationService.js";
import { createMissingPreferentialSlotsAtPositions } from "../../../../../../server/features/publication/publicationPreferentialSlots.js";
import PublicationModel from "../../../../../../server/features/publication/PublicationModel.js";
import "../../../../../../server/database/models.js";

export const runtime = "nodejs";

function getPublicationIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/publications\/([^/]+)\/preferential-slots(?:\/|$)/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication id not found in URL");
}

export const GET = createEndpoint(
    async (request) => {
        const publication_id = getPublicationIdFromRequest(request);
        const url = new URL(request.url);
        const ensureMissing = url.searchParams.get("ensure") !== "false";
        const data = await listPreferentialSlotsForPublication(publication_id, { ensureMissing });
        return NextResponse.json(data);
    },
    null,
    true
);

const postSchema = Joi.object({
    positions: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
});

export const POST = createEndpoint(
    async (request, body) => {
        const publication_id = getPublicationIdFromRequest(request);
        const publication = await PublicationModel.findOne({
            where: { publication_id },
            attributes: ["publication_id", "magazine_id"],
        });
        if (!publication) {
            return NextResponse.json({ message: "Publication not found" }, { status: 404 });
        }
        const magazineId =
            publication.get("magazine_id") != null
                ? String(publication.get("magazine_id")).trim()
                : "";
        if (!magazineId) {
            return NextResponse.json(
                { message: "Publication is not linked to a magazine" },
                { status: 400 }
            );
        }

        const result = await createMissingPreferentialSlotsAtPositions({
            publicationId: publication_id,
            magazineId,
            positions: body.positions,
        });
        const data = await listPreferentialSlotsForPublication(publication_id, { ensureMissing: false });
        return NextResponse.json({ ...result, ...data });
    },
    postSchema,
    true
);
