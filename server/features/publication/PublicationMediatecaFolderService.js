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
import "../../database/models.js";

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
            return String(linked.get("id"));
        }
    }

    const magazinesMediaId = await getOrCreateMagazinesMediaFolderId({ transaction });
    if (!magazinesMediaId) return null;

    const folder = await ensureFolder(magazinesMediaId, desired, { transaction });
    const folderId = String(folder.get("id"));

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
