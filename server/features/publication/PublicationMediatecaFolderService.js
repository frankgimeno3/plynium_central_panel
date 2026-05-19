/**
 * PublicationMediatecaFolderService – keeps every publication linked to a
 * dedicated folder under
 *   Structural media / Production media / publications media / magazines media
 *
 * The folder name mirrors `publication_edition_name`. It is created on
 * publication insertion and renamed automatically whenever the edition name
 * changes (see PublicationService.updatePublication and the publications-db
 * PUT route).
 *
 * For backward compatibility with publications created before column
 * `mediateca_folder_id` existed, every helper transparently backfills the
 * folder when invoked (see `ensurePublicationMediatecaFolder`).
 */

import { Op, Sequelize } from "sequelize";
import FolderModel from "../folder/FolderModel.js";
import { deleteFolder, getFolderIdByPath } from "../folder/FolderService.js";
import PublicationModel from "./PublicationModel.js";
import { PublicationSlotDbModel } from "../../database/models.js";
import "../../database/models.js";

/** Child of each publication folder: assets for article (magazine) pages. */
export const PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME = "articles media";

/** Child of each publication folder: advert / project slot creatives. */
export const PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME = "adverts media";

/** Stable child for cover advert assets. Do not use `slot_{id}` for cover. */
export const PUBLICATION_COVER_ADVERT_FOLDER_NAME = "cover";

/** Child of each advert slot folder: full cover composite for flatplan preview. */
export const PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME = "final";

/** Auto-generated advert index PDF folder (one per publication, sibling of "articles media"). */
export const PUBLICATION_INDEX_FOLDER_NAME = "index";

/** Auto-generated article summary PDF folder (one per publication, sibling of "articles media"). */
export const PUBLICATION_SUMMARY_FOLDER_NAME = "summary";

/** Path of the parent folder that hosts one subfolder per publication. */
export const MAGAZINES_MEDIA_FOLDER_PATH =
    "Structural media/Production media/publications media/magazines media";

const MAGAZINES_MEDIA_SEGMENTS = [
    "structural media",
    "production media",
    "publications media",
    "magazines media",
];

function normalizeSegment(name) {
    if (typeof name !== "string") return "";
    return name.trim().replace(/\s+/g, " ");
}

function caseInsensitiveNameWhere(name) {
    const expected = normalizeSegment(name).toLowerCase();
    return Sequelize.where(
        Sequelize.fn(
            "regexp_replace",
            Sequelize.fn("lower", Sequelize.col("mediateca_folder_name")),
            "\\s+",
            " ",
            "g"
        ),
        expected
    );
}

async function findChildByName(parentId, name, transaction) {
    const where = parentId == null
        ? { parent_id: null, [Op.and]: [caseInsensitiveNameWhere(name)] }
        : { parent_id: parentId, [Op.and]: [caseInsensitiveNameWhere(name)] };
    return FolderModel.findOne({ where, transaction });
}

async function ensureFolder(parentId, name, { transaction }) {
    const existing = await findChildByName(parentId, name, transaction);
    if (existing) return existing;
    return FolderModel.create(
        { name: normalizeSegment(name), parent_id: parentId },
        { transaction }
    );
}

/**
 * Resolve (creating along the way) the parent "magazines media" folder.
 * Every segment of {@link MAGAZINES_MEDIA_FOLDER_PATH} except the leaf is
 * expected to already exist (it is part of the seeded mediateca tree); if any
 * is missing we create it so the chain is always complete.
 */
async function getOrCreateMagazinesMediaFolderId({ transaction }) {
    if (!FolderModel.sequelize) return null;
    let parentId = null;
    for (const segment of MAGAZINES_MEDIA_SEGMENTS) {
        const folder = await ensureFolder(parentId, segment, { transaction });
        parentId = folder.get("id");
    }
    return parentId;
}

function desiredFolderName(publication) {
    const editionName = publication?.get
        ? publication.get("publication_edition_name")
        : publication?.publication_edition_name;
    const fallback = publication?.get
        ? publication.get("publication_id")
        : publication?.publication_id;
    const name = String(editionName ?? "").trim();
    return name || String(fallback ?? "Publication");
}

/**
 * Make sure the publication points to a valid folder under "magazines media"
 * named after its current edition name. Idempotent: safe to call multiple
 * times. Returns the folder id (or null when the database is not configured).
 *
 * @param {import("sequelize").Model} publication - PublicationModel instance.
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>}
 */
export async function ensurePublicationMediatecaFolder(publication, options = {}) {
    if (!publication || !FolderModel.sequelize) return null;
    const { transaction } = options;

    const desired = desiredFolderName(publication);
    const linkedId = publication.get("mediateca_folder_id");

    if (linkedId) {
        const linked = await FolderModel.findByPk(linkedId, { transaction });
        if (linked) {
            const currentName = String(linked.get("name") ?? "");
            if (normalizeSegment(currentName) !== normalizeSegment(desired)) {
                await linked.update({ name: normalizeSegment(desired) }, { transaction });
            }
            const pubRootId = String(linked.get("id"));
            await ensureFolder(pubRootId, PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME, { transaction });
            await ensureFolder(pubRootId, PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME, { transaction });
            await ensureFolder(pubRootId, PUBLICATION_INDEX_FOLDER_NAME, { transaction });
            await ensureFolder(pubRootId, PUBLICATION_SUMMARY_FOLDER_NAME, { transaction });
            return pubRootId;
        }
    }

    const magazinesMediaId = await getOrCreateMagazinesMediaFolderId({ transaction });
    if (!magazinesMediaId) return null;

    const folder = await ensureFolder(magazinesMediaId, desired, { transaction });
    const folderId = String(folder.get("id"));

    await ensureFolder(folderId, PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME, { transaction });
    await ensureFolder(folderId, PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME, { transaction });
    await ensureFolder(folderId, PUBLICATION_INDEX_FOLDER_NAME, { transaction });
    await ensureFolder(folderId, PUBLICATION_SUMMARY_FOLDER_NAME, { transaction });

    if (publication.get("mediateca_folder_id") !== folderId) {
        await publication.update({ mediateca_folder_id: folderId }, { transaction });
    }

    return folderId;
}

/**
 * Build the slash-joined path used by the Mediateca modal for a publication
 * whose folder name is `editionName`. Always rooted under
 * {@link MAGAZINES_MEDIA_FOLDER_PATH}; falls back to that parent when no
 * edition name is provided.
 *
 * @param {string} editionName
 * @returns {string}
 */
export function publicationMediatecaPath(editionName) {
    const trimmed = String(editionName ?? "").trim();
    if (!trimmed) return MAGAZINES_MEDIA_FOLDER_PATH;
    return `${MAGAZINES_MEDIA_FOLDER_PATH}/${trimmed}`;
}

/**
 * Mediateca path for one magazine article page slot (multiple files allowed under this folder).
 * Mirrors folder rows created by {@link ensureArticleSlotMaterialsFolderHierarchy}.
 *
 * @param {string} editionName
 * @param {string} articleId
 * @param {number} slotId
 * @returns {string}
 */
export function articleSlotMaterialsMediatecaPath(editionName, articleId, slotId) {
    const base = publicationMediatecaPath(editionName);
    const aid = String(articleId ?? "").trim();
    const sid = Number(slotId);
    if (!aid || !Number.isInteger(sid) || sid <= 0) return base;
    return `${base}/${PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME}/${aid}/slot_${sid}`;
}

/**
 * Mediateca path for one advert slot (cover or regular advert page).
 *
 * @param {string} editionName
 * @param {number} slotId
 * @returns {string}
 */
export function advertSlotMaterialsMediatecaPath(editionName, slotId) {
    const base = publicationMediatecaPath(editionName);
    const sid = Number(slotId);
    if (!Number.isInteger(sid) || sid <= 0) {
        return `${base}/${PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME}`;
    }
    return `${base}/${PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME}/slot_${sid}`;
}

export function advertSlotMaterialsFinalMediatecaPath(editionName, slotId) {
    return `${advertSlotMaterialsMediatecaPath(editionName, slotId)}/${PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME}`;
}

export function coverAdvertMaterialsMediatecaPath(editionName) {
    const base = publicationMediatecaPath(editionName);
    return `${base}/${PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME}/${PUBLICATION_COVER_ADVERT_FOLDER_NAME}`;
}

export function coverAdvertMaterialsFinalMediatecaPath(editionName) {
    return `${coverAdvertMaterialsMediatecaPath(editionName)}/${PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME}`;
}

/**
 * Mediateca path for auto-generated advert index PDF (one per publication).
 * @param {string} editionName
 * @returns {string}
 */
export function publicationIndexMediatecaPath(editionName) {
    const base = publicationMediatecaPath(editionName);
    return `${base}/${PUBLICATION_INDEX_FOLDER_NAME}`;
}

/**
 * Mediateca path for auto-generated article summary PDF (one per publication).
 * @param {string} editionName
 * @returns {string}
 */
export function publicationSummaryMediatecaPath(editionName) {
    const base = publicationMediatecaPath(editionName);
    return `${base}/${PUBLICATION_SUMMARY_FOLDER_NAME}`;
}

/**
 * Ensure `…/{edition}/index/` exists.
 * @param {import("sequelize").Model} publication
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>}
 */
export async function ensurePublicationIndexFolderHierarchy(publication, options = {}) {
    if (!publication || !FolderModel.sequelize) return null;
    const { transaction } = options;
    const rootId = await ensurePublicationMediatecaFolder(publication, options);
    if (!rootId) return null;
    const folder = await ensureFolder(rootId, PUBLICATION_INDEX_FOLDER_NAME, { transaction });
    return String(folder.get("id"));
}

/**
 * Ensure `…/{edition}/summary/` exists.
 * @param {import("sequelize").Model} publication
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>}
 */
export async function ensurePublicationSummaryFolderHierarchy(publication, options = {}) {
    if (!publication || !FolderModel.sequelize) return null;
    const { transaction } = options;
    const rootId = await ensurePublicationMediatecaFolder(publication, options);
    if (!rootId) return null;
    const folder = await ensureFolder(rootId, PUBLICATION_SUMMARY_FOLDER_NAME, { transaction });
    return String(folder.get("id"));
}

/**
 * Ensure `…/{edition}/articles media/{articleId}/slot_{slotId}/` exists.
 *
 * @param {import("sequelize").Model} publication
 * @param {string} articleId
 * @param {number} slotId
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>} Deepest folder id, or null.
 */
export async function ensureArticleSlotMaterialsFolderHierarchy(publication, articleId, slotId, options = {}) {
    if (!publication || !FolderModel.sequelize) return null;
    const aid = String(articleId ?? "").trim();
    const sid = Number(slotId);
    if (!aid || !Number.isInteger(sid) || sid <= 0) return null;
    const { transaction } = options;
    const rootId = await ensurePublicationMediatecaFolder(publication, options);
    if (!rootId) return null;
    const articlesRoot = await ensureFolder(rootId, PUBLICATION_ARTICLES_MEDIA_FOLDER_NAME, { transaction });
    const articleFolder = await ensureFolder(articlesRoot.get("id"), aid, { transaction });
    const slotFolder = await ensureFolder(articleFolder.get("id"), `slot_${sid}`, { transaction });
    return String(slotFolder.get("id"));
}

/**
 * Ensure `…/{edition}/adverts media/slot_{slotId}/` exists.
 * Cover slots are routed to `…/adverts media/cover/`.
 *
 * @param {import("sequelize").Model} publication
 * @param {number} slotId
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>}
 */
export async function ensureAdvertSlotMaterialsFolderHierarchy(publication, slotId, options = {}) {
    if (!publication || !FolderModel.sequelize) return null;
    const sid = Number(slotId);
    if (!Number.isInteger(sid) || sid <= 0) return null;
    const { transaction } = options;
    const slot = await PublicationSlotDbModel.findByPk(sid, { transaction });
    if (String(slot?.get?.("slot_key") ?? "").trim().toLowerCase() === "cover") {
        return ensureCoverAdvertMaterialsFolderHierarchy(publication, options);
    }
    const rootId = await ensurePublicationMediatecaFolder(publication, options);
    if (!rootId) return null;
    const advertsRoot = await ensureFolder(rootId, PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME, { transaction });
    const slotFolder = await ensureFolder(advertsRoot.get("id"), `slot_${sid}`, { transaction });
    return String(slotFolder.get("id"));
}

/**
 * Ensure `…/{edition}/adverts media/cover/` exists.
 *
 * @param {import("sequelize").Model} publication
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>}
 */
export async function ensureCoverAdvertMaterialsFolderHierarchy(publication, options = {}) {
    if (!publication || !FolderModel.sequelize) return null;
    const { transaction } = options;
    const rootId = await ensurePublicationMediatecaFolder(publication, options);
    if (!rootId) return null;
    const advertsRoot = await ensureFolder(rootId, PUBLICATION_ADVERTS_MEDIA_FOLDER_NAME, { transaction });
    const coverFolder = await ensureFolder(advertsRoot.get("id"), PUBLICATION_COVER_ADVERT_FOLDER_NAME, { transaction });
    return String(coverFolder.get("id"));
}

/**
 * Ensure `…/{edition}/adverts media/slot_{slotId}/final/` exists.
 * Cover slots are routed to `…/adverts media/cover/final/`.
 *
 * @param {import("sequelize").Model} publication
 * @param {number} slotId
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>} Deepest folder id (`final`), or null.
 */
export async function ensureAdvertSlotMaterialsFinalFolderHierarchy(publication, slotId, options = {}) {
    const slotFolderId = await ensureAdvertSlotMaterialsFolderHierarchy(publication, slotId, options);
    if (!slotFolderId) return null;
    const { transaction } = options;
    const finalFolder = await ensureFolder(
        slotFolderId,
        PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME,
        { transaction }
    );
    return String(finalFolder.get("id"));
}

/**
 * Ensure `…/{edition}/adverts media/cover/final/` exists.
 *
 * @param {import("sequelize").Model} publication
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<string | null>} Deepest folder id (`final`), or null.
 */
export async function ensureCoverAdvertMaterialsFinalFolderHierarchy(publication, options = {}) {
    const coverFolderId = await ensureCoverAdvertMaterialsFolderHierarchy(publication, options);
    if (!coverFolderId) return null;
    const { transaction } = options;
    const finalFolder = await ensureFolder(
        coverFolderId,
        PUBLICATION_ADVERT_SLOT_FINAL_FOLDER_NAME,
        { transaction }
    );
    return String(finalFolder.get("id"));
}

/**
 * Ensure the mediateca folder for one publication slot exists and return its id + path.
 * Idempotent; safe before opening the mediateca modal or uploading files.
 *
 * @param {string} publicationId
 * @param {number} slotId
 * @param {{ transaction?: import("sequelize").Transaction }} [options]
 * @returns {Promise<{ folderId: string | null, folderPath: string | null }>}
 */
export async function ensurePublicationSlotMediatecaFolderByIds(publicationId, slotId, options = {}) {
    if (!FolderModel.sequelize) {
        return { folderId: null, folderPath: null };
    }
    const pubId = String(publicationId ?? "").trim();
    const sid = Number(slotId);
    if (!pubId || !Number.isInteger(sid) || sid <= 0) {
        return { folderId: null, folderPath: null };
    }

    const publication = await PublicationModel.findByPk(pubId, options);
    if (!publication) {
        return { folderId: null, folderPath: null };
    }

    const slot = await PublicationSlotDbModel.findByPk(sid, options);
    if (!slot || String(slot.get("publication_id") ?? "") !== pubId) {
        return { folderId: null, folderPath: null };
    }

    const edition = desiredFolderName(publication);
    const slotType = String(slot.get("slot_content_type") ?? "").trim().toLowerCase();
    const slotKey = String(slot.get("slot_key") ?? "").trim().toLowerCase();
    const articleId = slot.get("slot_article_id");

    let folderId;
    let folderPath;
    if (slotKey === "cover") {
        folderId = await ensureCoverAdvertMaterialsFolderHierarchy(publication, options);
        folderPath = coverAdvertMaterialsMediatecaPath(edition);
    } else if (slotType === "article" && articleId) {
        folderId = await ensureArticleSlotMaterialsFolderHierarchy(
            publication,
            String(articleId),
            sid,
            options
        );
        folderPath = articleSlotMaterialsMediatecaPath(edition, String(articleId), sid);
    } else {
        folderId = await ensureAdvertSlotMaterialsFolderHierarchy(publication, sid, options);
        folderPath = advertSlotMaterialsMediatecaPath(edition, sid);
    }

    return {
        folderId: folderId ?? null,
        folderPath: folderPath ?? null,
    };
}

/**
 * Deletes the mediateca folder used for this slot's materials (S3 + DB), when it exists.
 * Article slots use `articles media/{articleId}/slot_{id}`; cover uses `adverts media/cover`;
 * other advert slots use `adverts media/slot_{id}`.
 *
 * @param {{ publicationId: string, slotId: number, slotContentType: string, slotArticleId?: string | null }} args
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deletePublicationSlotMediatecaFolder(args) {
    const publicationId = String(args?.publicationId ?? "").trim();
    const slotId = Number(args?.slotId);
    const slotContentType = String(args?.slotContentType ?? "").trim().toLowerCase();
    const slotArticleId = args?.slotArticleId != null ? String(args.slotArticleId).trim() : "";
    if (!publicationId || !Number.isInteger(slotId) || slotId <= 0) {
        return { deleted: false };
    }
    if (!FolderModel.sequelize) return { deleted: false };

    const publication = await PublicationModel.findByPk(publicationId);
    if (!publication) return { deleted: false };

    const editionLabel = desiredFolderName(publication);
    const slot = await PublicationSlotDbModel.findByPk(slotId);
    const slotKey = String(slot?.get?.("slot_key") ?? "").trim().toLowerCase();
    let path;
    if (slotKey === "cover") {
        path = coverAdvertMaterialsMediatecaPath(editionLabel);
    } else if (slotContentType === "article" && slotArticleId) {
        path = articleSlotMaterialsMediatecaPath(editionLabel, slotArticleId, slotId);
    } else {
        path = advertSlotMaterialsMediatecaPath(editionLabel, slotId);
    }

    let folderId;
    try {
        folderId = await getFolderIdByPath(path);
    } catch (e) {
        console.warn("[PublicationMediatecaFolderService] getFolderIdByPath:", path, e?.message ?? e);
        return { deleted: false };
    }
    if (!folderId) return { deleted: false };

    try {
        await deleteFolder(folderId);
        return { deleted: true };
    } catch (e) {
        console.warn("[PublicationMediatecaFolderService] deleteFolder:", path, e?.message ?? e);
        return { deleted: false };
    }
}
