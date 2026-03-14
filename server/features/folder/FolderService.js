/**
 * FolderService – mediateca folders. Persists to RDS table `folders`.
 */

import FolderModel from "./FolderModel.js";
import "../../database/models.js";

/**
 * Resolve path string to folder id (for listing children or setting parent).
 * path "" -> null (root). path "a" -> id of folder with name "a" and parent_id null. path "a/b" -> id of folder "b" under "a".
 * @param {string} path
 * @returns {Promise<string | null>}
 */
export async function getFolderIdByPath(path) {
    if (!FolderModel.sequelize) return null;
    const segments = typeof path === "string" ? path.split("/").filter(Boolean) : [];
    let parentId = null;
    for (const name of segments) {
        const row = await FolderModel.findOne({
            where: { parent_id: parentId, name: name.trim() },
            attributes: ["id"],
        });
        if (!row) return null;
        parentId = row.id;
    }
    return parentId;
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
        const parentId = await getFolderIdByPath(path);
        const where = parentId == null ? { parent_id: null } : { parent_id: parentId };
        const rows = await FolderModel.findAll({
            where,
            order: [["name", "ASC"]],
            attributes: ["id", "name", "parent_id"],
        });
        const prefix = path ? `${path}/` : "";
        return rows.map((row) => ({
            id: String(row.id),
            name: row.name,
            path: prefix + row.name,
        }));
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
    const name = data?.name ? String(data.name).trim() : "";
    const path = typeof data?.path === "string" ? data.path.trim() : "";
    if (!name) {
        throw new Error("name is required");
    }
    if (!FolderModel.sequelize) {
        throw new Error("Database not configured");
    }
    const parentId = await getFolderIdByPath(path);
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
