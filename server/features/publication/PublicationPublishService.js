import { Op } from "sequelize";
import {
    PublicationModel,
    PublicationSlotDbModel,
    PublicationArticleDbModel,
} from "../../database/models.js";
import { PUBLICATION_ARTICLE_STATE_PUBLISH_REQUIRED } from "../publication_workflow/publicationArticleState.js";
import "../../database/models.js";

function normalizeSlotContentType(value) {
    return String(value ?? "advert").trim().toLowerCase();
}

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

/**
 * @param {string} publicationId
 * @returns {Promise<{ blockers: string[], publication: import("sequelize").Model | null }>}
 */
export async function getPublicationPublishBlockers(publicationId) {
    const id = String(publicationId ?? "").trim();
    if (!id) {
        return { blockers: ["Missing publication id."], publication: null };
    }

    const publication = await PublicationModel.findByPk(id);
    if (!publication) {
        return { blockers: ["Publication not found."], publication: null };
    }

    const status = String(publication.get("publication_status") ?? "")
        .trim()
        .toLowerCase();
    if (status === "published") {
        return { blockers: ["This publication is already published."], publication };
    }
    if (status === "cancelled") {
        return { blockers: ["Cancelled publications cannot be published."], publication };
    }

    const blockers = [];

    if (!publication.get("is_index_ready")) {
        blockers.push(
            'Advertiser index is not marked ready. Open the index slot and set "Is index ready?" to Yes.'
        );
    }
    if (!publication.get("is_summary_ready")) {
        blockers.push(
            'Article summary is not marked ready. Open the summary slot and set "Is summary ready?" to Yes.'
        );
    }

    const slots = await PublicationSlotDbModel.findAll({
        where: { publication_id: id },
        attributes: [
            "publication_slot_id",
            "slot_key",
            "publication_page",
            "slot_content_type",
        ],
        order: [
            ["publication_page", "ASC"],
            ["slot_ordinal", "ASC"],
        ],
    });

    const slotIds = slots.map((s) => s.get("publication_slot_id")).filter(Boolean);
    const articles =
        slotIds.length > 0
            ? await PublicationArticleDbModel.findAll({
                  where: {
                      publication_id: id,
                      publication_slots_id_array: { [Op.overlap]: slotIds },
                  },
                  attributes: [
                      "publication_article_id",
                      "publication_article_state",
                      "publication_slots_id_array",
                  ],
              })
            : [];

    const slotToArticle = new Map();
    for (const row of articles) {
        const paId = String(row.get("publication_article_id") ?? "");
        const state = String(row.get("publication_article_state") ?? "unfinished").trim();
        const slotIdList = row.get("publication_slots_id_array") ?? [];
        for (const sid of slotIdList) {
            const n = Number(sid);
            if (Number.isInteger(n) && n > 0 && !slotToArticle.has(n)) {
                slotToArticle.set(n, { paId, state });
            }
        }
    }

    const byPaState = new Map();
    const orphanMagPages = [];

    for (const slot of slots) {
        const sk = String(slot.get("slot_key") ?? "").trim().toLowerCase();
        if (sk !== "regular_page") continue;
        if (normalizeSlotContentType(slot.get("slot_content_type")) !== "article") continue;

        const magPgRaw = slot.get("publication_page");
        const magPg =
            magPgRaw != null && Number.isFinite(Number(magPgRaw))
                ? Math.round(Number(magPgRaw))
                : null;
        const sid = slot.get("publication_slot_id");
        const link = slotToArticle.get(Number(sid));
        if (!link?.paId) {
            if (magPg != null) orphanMagPages.push(magPg);
            continue;
        }
        if (!byPaState.has(link.paId)) byPaState.set(link.paId, link.state);
    }

    if (orphanMagPages.length) {
        const u = [...new Set(orphanMagPages)].sort((a, b) => a - b);
        blockers.push(
            `Article slot(s) on magazine page(s) ${u.join(", ")} are not linked to a publication article. Assign them in Article Builder before publishing.`
        );
    }
    for (const [paId, state] of byPaState) {
        if (state !== PUBLICATION_ARTICLE_STATE_PUBLISH_REQUIRED) {
            const short = paId.slice(0, 8);
            blockers.push(
                `Publication article ${short}… must be “finished approved” (currently “${state}”). Update workflow state in Article Builder.`
            );
        }
    }

    return { blockers, publication };
}

/**
 * Publishes a magazine issue: status → published, real_publication_month_date → today.
 *
 * @param {string} publicationId
 */
export async function publishPublication(publicationId) {
    const { blockers, publication } = await getPublicationPublishBlockers(publicationId);
    if (!publication) {
        const err = new Error(blockers[0] ?? "Publication not found");
        err.statusCode = 404;
        throw err;
    }
    if (blockers.length) {
        const err = new Error(blockers.join(" "));
        err.statusCode = 409;
        err.blockers = blockers;
        throw err;
    }

    await publication.update({
        publication_status: "published",
        real_publication_month_date: todayIsoDate(),
    });

    return publication;
}
