import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
    getPublicationArticleWithChunks,
    setPublicationArticleMagazinePageLayout,
    updatePublicationArticle,
    removePublicationArticle,
} from "../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { PUBLICATION_ARTICLE_STATE_VALUES } from "../../../../../server/features/publication_workflow/publicationArticleState.js";
import { triggerRegeneratePublicationIndexAndSummary } from "../../../../../server/features/publication/PublicationIndexSummaryService.js";
import { PublicationArticleDbModel } from "../../../../../server/database/models.js";

export const runtime = "nodejs";

function getPublicationArticleIdFromRequest(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(
        /\/api\/v1\/publication-articles\/([^/]+)(?:\/|$)/
    );
    if (match?.[1]) return decodeURIComponent(match[1]);
    throw new Error("publication_article_id not found in URL");
}

const patchSchema = Joi.object({
    desired_page_count: Joi.number().integer().min(1).optional(),
    publication_slots_id_array: Joi.array().items(Joi.number().integer()).optional(),
    publication_article_state: Joi.string()
        .valid(...PUBLICATION_ARTICLE_STATE_VALUES)
        .optional(),
    magazine_page_layout: Joi.string().valid("2_col_article", "3_col_article").optional(),
    publication_art_name: Joi.string().max(255).allow("", null).optional(),
    has_article_box: Joi.boolean().allow(null).optional(),
    box_company_name: Joi.string().allow("", null).optional(),
    box_company_direction: Joi.string().allow("", null).optional(),
    box_company_city: Joi.string().allow("", null).optional(),
    box_company_email: Joi.string().trim().email({ tlds: { allow: false } }).allow("", null).optional(),
    box_company_phone: Joi.string().allow("", null).optional(),
    box_company_web: Joi.string().allow("", null).optional(),
});

/** Returns publication_article + ordered chunks list. */
export const GET = createEndpoint(
    async (request) => {
        const id = getPublicationArticleIdFromRequest(request);
        const url = new URL(request.url);
        const ensureAllMagazineSlots = url.searchParams.get("ensure_all_magazine_slots") === "1";
        const rawSlot =
            url.searchParams.get("ensure_slot_id") ??
            url.searchParams.get("ensure_slot_content_id");
        let ensureSlotId;
        if (!ensureAllMagazineSlots && rawSlot != null && rawSlot !== "") {
            const n = Number(rawSlot);
            if (Number.isInteger(n) && n > 0) {
                ensureSlotId = n;
            }
        }
        const data = await getPublicationArticleWithChunks(id, {
            ensureAllMagazineSlots,
            ensureSlotId,
        });
        if (!data) {
            return NextResponse.json(
                { message: "publication_article not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(data);
    },
    null,
    true
);

/**
 * Patches `desired_page_count`, `publication_slots_id_array`, and/or
 * `publication_article_state`. Slot provisioning is handled by dedicated endpoints.
 */
export const PATCH = createEndpoint(
    async (request, body) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            let layoutResult = null;
            if (body?.magazine_page_layout !== undefined) {
                layoutResult = await setPublicationArticleMagazinePageLayout(
                    id,
                    body.magazine_page_layout
                );
            }
            const patchBody = { ...(body ?? {}) };
            delete patchBody.magazine_page_layout;
            const updated = await updatePublicationArticle(id, patchBody);
            if (!updated && !layoutResult) {
                return NextResponse.json(
                    { message: "publication_article not found" },
                    { status: 404 }
                );
            }
            const publicationIdForRegen =
                updated?.publication_id ??
                layoutResult?.publication_id ??
                null;
            if (publicationIdForRegen) {
                triggerRegeneratePublicationIndexAndSummary(String(publicationIdForRegen));
            }
            if (layoutResult && !updated) {
                return NextResponse.json({
                    publication_article_id: id,
                    ...layoutResult,
                });
            }
            return NextResponse.json({
                ...updated,
                ...(layoutResult
                    ? {
                          magazine_page_layout: layoutResult.magazine_page_layout,
                          updated_slot_content_count: layoutResult.updated_slot_content_count,
                      }
                    : {}),
            });
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to update publication_article" },
                { status }
            );
        }
    },
    patchSchema,
    true
);

/** Removes the publication_article row + every chunk attached to it. */
export const DELETE = createEndpoint(
    async (request) => {
        const id = getPublicationArticleIdFromRequest(request);
        try {
            let publicationIdForRegen = null;
            if (PublicationArticleDbModel?.sequelize) {
                const ap = await PublicationArticleDbModel.findByPk(id);
                if (ap) publicationIdForRegen = String(ap.get("publication_id") ?? "").trim();
            }
            const result = await removePublicationArticle(id);
            if (publicationIdForRegen) {
                triggerRegeneratePublicationIndexAndSummary(publicationIdForRegen);
            }
            return NextResponse.json(result);
        } catch (error) {
            const status = Number.isFinite(Number(error?.statusCode))
                ? Number(error.statusCode)
                : 500;
            return NextResponse.json(
                { message: error?.message ?? "Failed to delete publication_article" },
                { status }
            );
        }
    },
    null,
    true
);
