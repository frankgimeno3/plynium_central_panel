/**
 * FolderService – mediateca folders. Persists to RDS table `mediateca_folders`.
 */

import { Op, Sequelize } from "sequelize";

/** Paths that cannot be renamed or deleted (case-insensitive). */
const PROTECTED_FOLDER_PATHS = new Set([
    "structural media",
    "structural media/invoices",
    "structural media/contracts",
    "structural media/proposals",
    "structural media/network media",
    "structural media/production media",
    "structural media/invoices/issued invoices",
    "structural media/invoices/providers invoices",
    "structural media/production media/newsletters media",
    "structural media/production media/publications media",
    "structural media/network media/content media",
    "structural media/network media/directory media",
    "structural media/network media/content media/articles media",
    "structural media/network media/content media/banners media",
    "structural media/network media/content media/events media",
    "structural media/network media/directory media/companies media",
    "structural media/network media/directory media/products media",
    "structural media/network media/directory media/users media",
]);

function normalizeFolderSegment(name) {
    if (typeof name !== "string") return "";
    return name.trim().replace(/\s+/g, " ");
}

function normalizedNameWhereClause(normalizedName) {
    const expected = normalizeFolderSegment(normalizedName).toLowerCase();
    const nameColumn =
        (FolderModel?.rawAttributes?.name && FolderModel.rawAttributes.name.field)
            ? FolderModel.rawAttributes.name.field
            : "name";
    // Match even if the stored name has inconsistent casing or multiple spaces.
    return Sequelize.where(
        Sequelize.fn(
            "regexp_replace",
            Sequelize.fn("lower", Sequelize.col(nameColumn)),
            "\\s+",
            " ",
            "g"
        ),
        expected
    );
}

function isFolderPathProtected(path) {
    if (typeof path !== "string") return false;
    const normalized = path.trim().toLowerCase().replace(/\s+/g, " ");
    return PROTECTED_FOLDER_PATHS.has(normalized);
}

import FolderModel from "./FolderModel.js";
import MediaModel from "../media/MediaModel.js";
import { deleteObjectFromS3 } from "../media/S3Service.js";
import "../../database/models.js";

/**
 * Resolve path string to folder id (for listing children or setting parent).
 * path "" -> null (root). path "a" -> id of folder with name "a" and parent_id null. path "a/b" -> id of folder "b" under "a".
 * @param {string} path
 * @returns {Promise<string | null>}
 */
export async function getFolderIdByPath(path) {
    const ids = await getFolderIdsByPath(path);
    return ids.length > 0 ? ids[0] : null;
}

/**
 * Resolve path string to folder ids (supports legacy duplicates).
 * path "" -> [null] (root). path "a" -> [ids of folders named "a" at root]. path "a/b" -> [ids of "b" under any matching "a"].
 * @param {string} path
 * @returns {Promise<Array<string|null>>}
 */
export async function getFolderIdsByPath(path) {
    if (!FolderModel.sequelize) return [];
    const segments = typeof path === "string" ? path.split("/").filter(Boolean) : [];
    // root
    if (segments.length === 0) return [null];

    let parentIds = [null];
    for (const seg of segments) {
        const normalizedName = normalizeFolderSegment(seg);
        if (!normalizedName) return [];

        const where = parentIds.length === 1 && parentIds[0] == null
            ? { parent_id: null, [Op.and]: [normalizedNameWhereClause(normalizedName)] }
            : { parent_id: { [Op.in]: parentIds }, [Op.and]: [normalizedNameWhereClause(normalizedName)] };

        const rows = await FolderModel.findAll({ where, attributes: ["id"] });
        const nextIds = rows.map((r) => String(r.id));
        if (nextIds.length === 0) return [];
        parentIds = nextIds;
    }
    return parentIds;
}

/**
 * List folders by path (direct children of the folder at path).
 * @param {{ path?: string }} opts - path defaults to "" (root).
 * @returns {Promise<Array<{ id: string, name: string, path: string }>>}
 */
export async function getFolders(opts = {}) {
    const path = typeof opts.path === "string" ? opts.path : "";
    try {
        if (!FolderModel.sequelize) return [];
        const parentIds = await getFolderIdsByPath(path);
        if (parentIds.length === 0) return [];
        const where = parentIds.length === 1 && parentIds[0] == null
            ? { parent_id: null }
            : { parent_id: { [Op.in]: parentIds.filter((x) => x != null) } };
        const rows = await FolderModel.findAll({
            where,
            order: [["name", "ASC"]],
            attributes: ["id", "name", "parent_id"],
        });
        const result = [];
        for (const row of rows) {
            const folderPath = await getFolderPathById(row.id);
            result.push({
                id: String(row.id),
                name: row.name,
                path: folderPath,
            });
        }
        return result;
    } catch (err) {
        console.error("FolderService.getFolders:", err);
        return [];
    }
}

/**
 * Create a folder.
 * @param {{ name: string, path?: string }} data - name and optional parent path ("" = root).
 * @returns {Promise<{ id: string, name: string, path: string }>}
 */
export async function createFolder(data) {
    const name = normalizeFolderSegment(data?.name ? String(data.name) : "");
    const path = typeof data?.path === "string" ? data.path.trim() : "";
    if (!name) {
        throw new Error("name is required");
    }
    if (!FolderModel.sequelize) {
        throw new Error("Database not configured");
    }
    const parentId = await getFolderIdByPath(path);
    // Prevent duplicates ignoring case/whitespace (path resolution uses iLike).
    const existingSibling = await FolderModel.findOne({
        where: { parent_id: parentId, [Op.and]: [normalizedNameWhereClause(name)] },
        attributes: ["id"],
    });
    if (existingSibling) {
        throw new Error("A folder with this name already exists at this path");
    }
    const row = await FolderModel.create({
        name,
        parent_id: parentId,
    });
    const folderPath = path ? `${path}/${name}` : name;
    return {
        id: String(row.id),
        name: row.name,
        path: folderPath,
    };
}

/**
 * Get folder by path. Returns { id, name, path } or null if not found.
 * @param {string} path
 * @returns {Promise<{ id: string, name: string, path: string } | null>}
 */
export async function getFolderByPath(path) {
    const id = await getFolderIdByPath(path);
    if (!id) return null;
    const pathStr = await getFolderPathById(id);
    const segments = pathStr.split("/").filter(Boolean);
    const name = segments.length > 0 ? segments[segments.length - 1] : "";
    return { id: String(id), name, path: pathStr };
}

/**
 * Get folder path string from folder id (walk up parent_id to root).
 * @param {string} folderId - UUID of the folder.
 * @returns {Promise<string>} - path like "a" or "a/b" or "" if not found.
 */
export async function getFolderPathById(folderId) {
    if (!folderId || !FolderModel.sequelize) return "";
    const segments = [];
    let currentId = folderId;
    for (;;) {
        const row = await FolderModel.findByPk(currentId, { attributes: ["name", "parent_id"] });
        if (!row) break;
        segments.unshift(row.name);
        if (row.parent_id == null) break;
        currentId = row.parent_id;
    }
    return segments.join("/");
}

/**
 * Get all descendant folder ids (recursive, including the folder itself).
 * @param {string} folderId
 * @returns {Promise<string[]>}
 */
async function getDescendantFolderIds(folderId) {
    if (!folderId || !FolderModel.sequelize) return [];
    const ids = [folderId];
    let current = [folderId];
    while (current.length > 0) {
        const rows = await FolderModel.findAll({
            where: { parent_id: { [Op.in]: current } },
            attributes: ["id"],
        });
        const next = rows.map((r) => String(r.id));
        ids.push(...next);
        current = next;
    }
    return ids;
}

/**
 * Update folder name (rename). Fails if a sibling folder already has the new name.
 * @param {string} folderId
 * @param {{ name: string }} data
 * @returns {Promise<{ id: string, name: string, path: string }>}
 */
export async function updateFolder(folderId, data) {
    const name = normalizeFolderSegment(data?.name ? String(data.name) : "");
    if (!name) {
        throw new Error("name is required");
    }
    if (!FolderModel.sequelize) {
        throw new Error("Database not configured");
    }
    const row = await FolderModel.findByPk(folderId, { attributes: ["id", "name", "parent_id"] });
    if (!row) {
        throw new Error("Folder not found");
    }
    const currentPathStr = await getFolderPathById(row.id);
    if (isFolderPathProtected(currentPathStr)) {
        throw new Error("This folder is protected and cannot be renamed");
    }
    const parentPath = await getFolderPathById(row.parent_id);
    const newPath = parentPath ? `${parentPath}/${name}` : name;
    const existingId = await getFolderIdByPath(newPath);
    if (existingId != null && existingId !== String(row.id)) {
        throw new Error("A folder with this name already exists at this path");
    }
    await row.update({ name });
    return {
        id: String(row.id),
        name: row.name,
        path: newPath,
    };
}

/**
 * Delete a folder and all its contents and nested subfolders (and their contents).
 * Deletes S3 objects for all media in the tree, then removes the folder (DB CASCADE removes children).
 * @param {string} folderId
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deleteFolder(folderId) {
    if (!folderId || typeof folderId !== "string") {
        throw new Error("folderId is required");
    }
    if (!FolderModel.sequelize) {
        throw new Error("Database not configured");
    }
    const row = await FolderModel.findByPk(folderId);
    if (!row) {
        throw new Error("Folder not found");
    }
    const folderPathStr = await getFolderPathById(folderId);
    if (isFolderPathProtected(folderPathStr)) {
        throw new Error("This folder is protected and cannot be deleted");
    }
    const folderIds = await getDescendantFolderIds(folderId);
    const mediaRows = await MediaModel.findAll({
        where: { folder_id: { [Op.in]: folderIds } },
        attributes: ["id", "s3_key"],
    });
    for (const media of mediaRows) {
        if (media.s3_key) {
            try {
                await deleteObjectFromS3(media.s3_key);
            } catch (e) {
                console.warn("FolderService.deleteFolder: S3 delete failed for", media.s3_key, e.message);
            }
        }
        await media.destroy();
    }
    await row.destroy();
    return { deleted: true };
}
