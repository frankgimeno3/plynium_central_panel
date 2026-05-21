/**
 * Article page screenshots stored under each article's mediateca `Screenshots/` folder.
 */

import { Op } from "sequelize";
import { PublicationArticleDbModel } from "../../database/models.js";
import "../../database/models.js";
import MediaModel from "../media/MediaModel.js";
import { getFolderIdByPath } from "../folder/FolderService.js";
import { deleteMedia, upsertImageInFolder } from "../media/MediaService.js";
import {
    articleScreenshotContentName,
    articleScreenshotsMediatecaPath,
    ensureArticleScreenshotsFolderHierarchy,
} from "./PublicationMediatecaFolderService.js";

/**
 * @param {number[]} slotsArray
 * @param {number} slotId
 * @returns {number} 1-based article page index, or 0 when not found.
 */
export function articlePageIndexForSlot(slotsArray, slotId) {
    const sid = Number(slotId);
    const arr = Array.isArray(slotsArray)
        ? slotsArray.map(Number).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    const idx = arr.findIndex((id) => id === sid);
    return idx >= 0 ? idx + 1 : 0;
}

/**
 * Upload or replace `Screenshot-p{n}.png` in the article Screenshots folder.
 *
 * @param {import("sequelize").Model} publication
 * @param {string} articleId - network `articles_db` id (slot_article_id)
 * @param {number} pageIndex - 1-based page within the publication article
 * @param {Buffer} buffer
 * @returns {Promise<{ cdnUrl: string, mediaId: string, contentName: string, folderPath: string }>}
 */
export async function upsertArticlePageScreenshot(publication, articleId, pageIndex, buffer) {
    const aid = String(articleId ?? "").trim();
    const page = Math.max(1, Math.round(Number(pageIndex)));
    if (!aid || !page) {
        throw new Error("articleId and pageIndex are required");
    }

    const folderId = await ensureArticleScreenshotsFolderHierarchy(publication, aid);
    if (!folderId) {
        throw new Error("Could not ensure Screenshots mediateca folder");
    }

    const editionName = publication.get("publication_edition_name") ?? "";
    const folderPath = articleScreenshotsMediatecaPath(editionName, aid);
    const contentName = articleScreenshotContentName(page);

    const { mediaId, cdnUrl } = await upsertImageInFolder({
        folderId,
        folderPath,
        filename: contentName,
        buffer,
        contentType: "image/png",
    });

    return {
        cdnUrl: cdnUrl || "",
        mediaId,
        contentName,
        folderPath,
    };
}

/**
 * Resolve flatplan preview URL from Screenshots folder when `slot_flatplan_image_url` is empty.
 *
 * @param {object} slotPlain - `publication_slots_db` row (plain or model attributes)
 * @param {string} editionName
 * @returns {Promise<string | null>}
 */
export async function resolveArticleSlotScreenshotUrl(slotPlain, editionName) {
    const stored = String(slotPlain?.slot_flatplan_image_url ?? "").trim();
    if (stored) return stored;

    const slotId = Number(slotPlain?.publication_slot_id);
    const articleId = String(slotPlain?.slot_article_id ?? "").trim();
    const publicationId = String(slotPlain?.publication_id ?? "").trim();
    if (!Number.isInteger(slotId) || slotId <= 0 || !articleId || !publicationId) {
        return null;
    }
    if (String(slotPlain?.slot_content_type ?? "").trim().toLowerCase() !== "article") {
        return null;
    }

    if (!MediaModel.sequelize) return null;

    let slotsArray = [];
    try {
        const pa = await PublicationArticleDbModel.findOne({
            where: { publication_id: publicationId, article_id: articleId },
            attributes: ["publication_slots_id_array"],
        });
        if (!pa) return null;
        slotsArray = pa.get("publication_slots_id_array") ?? [];
    } catch {
        return null;
    }

    const pageIndex = articlePageIndexForSlot(slotsArray, slotId);
    if (pageIndex < 1) return null;

    const folderPath = articleScreenshotsMediatecaPath(editionName, articleId);
    const folderId = await getFolderIdByPath(folderPath);
    if (!folderId) return null;

    const contentName = articleScreenshotContentName(pageIndex);
    const row = await MediaModel.findOne({
        where: {
            folder_id: folderId,
            content_name: { [Op.iLike]: contentName },
        },
        attributes: ["content_src"],
    });
    const url = String(row?.get?.("content_src") ?? row?.content_src ?? "").trim();
    return url || null;
}

const SCREENSHOT_NAME_RE = /^Screenshot-p(\d+)\.png$/i;

/**
 * Delete one page screenshot from mediateca (S3 + DB row).
 *
 * @param {import("sequelize").Model} publication
 * @param {string} articleId
 * @param {number} pageIndex - 1-based
 * @returns {Promise<boolean>} true when a row was removed
 */
export async function deleteArticlePageScreenshot(publication, articleId, pageIndex) {
    const aid = String(articleId ?? "").trim();
    const page = Math.max(1, Math.round(Number(pageIndex)));
    if (!aid || !page || !MediaModel.sequelize) return false;

    const editionName = publication.get("publication_edition_name") ?? "";
    const folderPath = articleScreenshotsMediatecaPath(editionName, aid);
    const folderId = await getFolderIdByPath(folderPath);
    if (!folderId) return false;

    const contentName = articleScreenshotContentName(page);
    const row = await MediaModel.findOne({
        where: {
            folder_id: folderId,
            content_name: { [Op.iLike]: contentName },
        },
    });
    if (!row) return false;

    try {
        await deleteMedia(String(row.get("id")));
        return true;
    } catch (err) {
        console.warn(
            "[ArticleScreenshotService] delete screenshot failed:",
            contentName,
            err?.message ?? err
        );
        return false;
    }
}

/**
 * Remove screenshots whose page index exceeds the current article page count
 * (e.g. after deleting page 2 of 2, removes `Screenshot-p2.png`).
 *
 * @param {import("sequelize").Model} publication
 * @param {string} articleId
 * @param {number} pageCount - number of pages still in the article
 * @returns {Promise<number>} deleted file count
 */
export async function pruneArticleScreenshotsBeyondPageCount(publication, articleId, pageCount) {
    const aid = String(articleId ?? "").trim();
    const maxPage = Math.max(0, Math.round(Number(pageCount)));
    if (!aid || !MediaModel.sequelize) return 0;

    const editionName = publication.get("publication_edition_name") ?? "";
    const folderPath = articleScreenshotsMediatecaPath(editionName, aid);
    const folderId = await getFolderIdByPath(folderPath);
    if (!folderId) return 0;

    const rows = await MediaModel.findAll({
        where: { folder_id: folderId },
        attributes: ["id", "content_name"],
    });

    let deleted = 0;
    for (const row of rows) {
        const name = String(row.get("content_name") ?? "").trim();
        const match = SCREENSHOT_NAME_RE.exec(name);
        if (!match) continue;
        const pageNum = Number(match[1]);
        if (!Number.isFinite(pageNum) || pageNum <= maxPage) continue;
        try {
            await deleteMedia(String(row.get("id")));
            deleted += 1;
        } catch (err) {
            console.warn(
                "[ArticleScreenshotService] prune screenshot failed:",
                name,
                err?.message ?? err
            );
        }
    }
    return deleted;
}
