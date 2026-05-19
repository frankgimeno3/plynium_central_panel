/**
 * Helpers for preferential summary/index moves: detect real slot occupancy and
 * swap advert media (and related fields) between two publication_slots_db rows.
 */

import { ProjectDbModel } from "../../database/models.js";

const RESERVED_CONTENT_TYPES = new Set(["summary", "index"]);

/**
 * @param {import("sequelize").Model | { get?: (k: string) => unknown } | null | undefined} slot
 * @returns {{ slot_media_url: string | null, customer_id: string | null, project_id: string | null, slot_article_id: string | null }}
 */
export function readSlotOccupancyFields(slot) {
    if (!slot) {
        return {
            slot_media_url: null,
            customer_id: null,
            project_id: null,
            slot_article_id: null,
        };
    }
    const get = (key) => (typeof slot.get === "function" ? slot.get(key) : slot[key]);
    const media = get("slot_media_url");
    const customer = get("customer_id");
    const project = get("project_id");
    const article = get("slot_article_id");
    return {
        slot_media_url: media != null && String(media).trim() !== "" ? String(media).trim() : null,
        customer_id: customer != null && String(customer).trim() !== "" ? String(customer).trim() : null,
        project_id: project != null && String(project).trim() !== "" ? String(project).trim() : null,
        slot_article_id: article != null && String(article).trim() !== "" ? String(article).trim() : null,
    };
}

/**
 * Slot has uploaded media, customer, project, or article — should warn before
 * overwriting with summary/index.
 *
 * @param {import("sequelize").Model | null | undefined} slot
 * @returns {boolean}
 */
export function slotHasOccupyingContent(slot) {
    const o = readSlotOccupancyFields(slot);
    return Boolean(o.slot_media_url || o.customer_id || o.project_id || o.slot_article_id);
}

export function slotHasUploadedMedia(slot) {
    return Boolean(readSlotOccupancyFields(slot).slot_media_url);
}

/**
 * Re-link projects_db rows after occupancy fields move between slot ids.
 *
 * @param {import("sequelize").Transaction} transaction
 * @param {string} publicationId
 * @param {number} slotId
 * @param {string | null} projectId
 */
async function syncProjectPublicationSlotLink(transaction, publicationId, slotId, projectId) {
    if (!ProjectDbModel?.sequelize) return;
    const sid = Number(slotId);
    if (!Number.isFinite(sid) || sid <= 0) return;

    const previousProject = await ProjectDbModel.findOne({
        where: { publication_slot_id: sid },
        transaction,
    });
    if (previousProject) {
        const linked = Number(previousProject.get("publication_slot_id"));
        if (linked === sid && String(previousProject.get("id_project") ?? "") !== String(projectId ?? "")) {
            await previousProject.update(
                { publication_id: null, publication_slot_id: null },
                { transaction }
            );
        }
    }

    if (!projectId) return;

    const project = await ProjectDbModel.findByPk(String(projectId), { transaction });
    if (!project) return;

    await project.update(
        {
            publication_id: String(publicationId),
            publication_slot_id: sid,
        },
        { transaction }
    );
}

/**
 * Exchange advert/article occupancy between two slots and assign new content
 * types. Used when moving summary/index onto a page that already has media.
 *
 * @param {{
 *   sourceSlot: import("sequelize").Model,
 *   targetSlot: import("sequelize").Model,
 *   publicationId: string,
 *   targetContentType: "summary" | "index",
 *   transaction: import("sequelize").Transaction,
 * }} args
 */
export async function swapSlotOccupancyForReservedMove({
    sourceSlot,
    targetSlot,
    publicationId,
    targetContentType,
    transaction,
}) {
    const sourceOcc = readSlotOccupancyFields(sourceSlot);
    const targetOcc = readSlotOccupancyFields(targetSlot);
    const targetPreviousType = String(targetSlot.get("slot_content_type") ?? "")
        .trim()
        .toLowerCase();

    const sourceSlotId = Number(sourceSlot.get("publication_slot_id"));
    const targetSlotId = Number(targetSlot.get("publication_slot_id"));

    const demotedSourceType = RESERVED_CONTENT_TYPES.has(targetPreviousType)
        ? targetPreviousType
        : "advert";

    await targetSlot.update(
        {
            slot_content_type: targetContentType,
            slot_media_url: sourceOcc.slot_media_url,
            customer_id: sourceOcc.customer_id,
            project_id: sourceOcc.project_id,
            slot_article_id: sourceOcc.slot_article_id,
        },
        { transaction }
    );

    await sourceSlot.update(
        {
            slot_content_type: demotedSourceType,
            slot_media_url: targetOcc.slot_media_url,
            customer_id: targetOcc.customer_id,
            project_id: targetOcc.project_id,
            slot_article_id: targetOcc.slot_article_id,
        },
        { transaction }
    );

    await syncProjectPublicationSlotLink(transaction, publicationId, targetSlotId, sourceOcc.project_id);
    await syncProjectPublicationSlotLink(transaction, publicationId, sourceSlotId, targetOcc.project_id);
}

/**
 * Move summary/index to target when target is empty; demote source to advert.
 *
 * @param {{
 *   sourceSlot: import("sequelize").Model | null,
 *   targetSlot: import("sequelize").Model,
 *   targetContentType: "summary" | "index",
 *   targetPreviousType: string,
 *   transaction: import("sequelize").Transaction,
 * }} args
 */
export async function applyReservedMoveWithoutOccupancySwap({
    sourceSlot,
    targetSlot,
    targetContentType,
    targetPreviousType,
    transaction,
}) {
    if (sourceSlot) {
        const demotedType = RESERVED_CONTENT_TYPES.has(targetPreviousType)
            ? targetPreviousType
            : "advert";
        await sourceSlot.update({ slot_content_type: demotedType }, { transaction });
    }
    await targetSlot.update({ slot_content_type: targetContentType }, { transaction });
}
