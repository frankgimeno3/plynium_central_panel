import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { assignPublicationArticleSlotPage } from "../../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { PublicationArticleDbModel } from "../../../../../../server/database/models.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/\/api\/v1\/publication-articles\/([^/]+)\/slot-page/);
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const patchSchema = Joi.object({
    page_index: Joi.number().integer().min(0).required(),
    publication_slot_id: Joi.number().integer().positive().required(),
});

export const PATCH = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            const updated = await assignPublicationArticleSlotPage(
                id,
                Number(body.page_index),
                Number(body.publication_slot_id)
            );
            try {
                if (PublicationArticleDbModel?.sequelize) {
                    const ap = await PublicationArticleDbModel.findByPk(id);
                    const pid = String(ap?.get?.("publication_id") ?? "").trim();
                    if (pid) triggerRegeneratePublicationIndexAndSummary(pid);
                }
            } catch {
                /* best-effort */
            }
            return NextResponse.json(updated);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to assign slot page" },
                { status }
            );
        }
    },
    patchSchema,
    true
);
