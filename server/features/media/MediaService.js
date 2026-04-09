import { Op, Sequelize } from "sequelize";
import { createPresignedUpload, deleteObjectFromS3 } from "./S3Service.js";
import { getFolderIdByPath, getFolderIdsByPath, getFolderPathById } from "../folder/FolderService.js";
import MediaModel from "./MediaModel.js";
import "../../database/models.js";

/**
 * List media by folderPath and optional search.
 * @param {{ folderPath?: string, search?: string }} params
 * @returns {Promise<Array<{ id: string, name: string, s3Key: string, url?: string, folderPath: string }>>}
 */
export async function getMedia(params = {}) {
    const folderPath = typeof params.folderPath === "string" ? params.folderPath : "";
    const search = typeof params.search === "string" ? params.search.trim() : "";
    try {
        if (!MediaModel.sequelize) return [];
        const folderIds = await getFolderIdsByPath(folderPath);
        if (folderIds.length === 0) return [];
        const nonNullIds = folderIds.filter((x) => x != null);
        const where = nonNullIds.length === 0 ? { folder_id: null } : { folder_id: { [Op.in]: nonNullIds } };
        if (search) {
            where.content_name = { [Op.iLike]: `%${search}%` };
        }
        const rows = await MediaModel.findAll({
            where,
            // Use real DB column name; `createdAt` ends up quoted as a column ("createdAt") with our model setup.
            order: [[Sequelize.literal('"media_content"."mediateca_content_created_at"'), "DESC"]],
            attributes: ["id", "content_name", "s3_key", "content_src", "folder_id"],
        });
        const result = [];
        for (const row of rows) {
            const path = row.folder_id ? await getFolderPathById(row.folder_id) : "";
            result.push({
                id: String(row.id),
                name: row.content_name,
                s3Key: row.s3_key,
                url: row.content_src || undefined,
                folderPath: path,
            });
        }
        return result;
    } catch (err) {
        console.error("MediaService.getMedia:", err);
        return [];
    }
}

/**
 * Create presigned upload (delegates to S3Service). Returns mediaId, uploadUrl, s3Key, cdnUrl.
 * @param {{ filename: string, contentType?: string }} data
 * @returns {Promise<{ uploadUrl: string, mediaId: string, s3Key: string, cdnUrl?: string }>}
 */
export async function createPresign(data) {
    return createPresignedUpload({
        filename: data?.filename,
        contentType: data?.contentType,
    });
}

/**
 * Register a new media record (after upload to S3). Uses mediaId from presign.
 * @param {{ mediaId: string, name: string, contentName?: string, s3Key: string, folderPath?: string, folderId?: string, cdnUrl?: string, contentType?: string, type: 'pdf' | 'image' }} data
 * @returns {Promise<{ id: string, name: string, s3Key: string, folderPath: string }>}
 */
export async function createMedia(data) {
    const mediaId = data?.mediaId ? String(data.mediaId).trim() : "";
    const name = (data?.contentName ?? data?.name) ? String(data.contentName ?? data.name).trim() : "";
    const s3Key = data?.s3Key ? String(data.s3Key).trim() : "";
    const cdnUrl = data?.cdnUrl ? String(data.cdnUrl).trim() : null;
    const contentType = data?.contentType ? String(data.contentType).trim() : null;
    const type = data?.type === "pdf" || data?.type === "image" ? data.type : (contentType && contentType.startsWith("application/pdf") ? "pdf" : "image");
    if (!mediaId || !name || !s3Key) {
        throw new Error("mediaId, name (or contentName), and s3Key are required");
    }
    if (!MediaModel.sequelize) {
        throw new Error("Database not configured");
    }
    let folderId = data?.folderId ? String(data.folderId).trim() : null;
    if (!folderId && data?.folderPath != null) {
        // If duplicates exist for the same folderPath, pick a stable canonical one.
        folderId = await getFolderIdByPath(String(data.folderPath));
    }
    await MediaModel.create({
        id: mediaId,
        folder_id: folderId || null,
        content_name: name,
        s3_key: s3Key,
        content_src: cdnUrl,
        mime_type: contentType,
        type,
    });
    const folderPath = folderId ? await getFolderPathById(folderId) : "";
    return {
        id: mediaId,
        name,
        s3Key,
        folderPath,
    };
}

/**
 * Get a single media item by id.
 * @param {string} mediaId
 * @returns {Promise<{ id: string, name: string, s3Key: string, url?: string, folderPath: string, contentType?: string } | null>}
 */
export async function getMediaById(mediaId) {
    if (!mediaId || typeof mediaId !== "string") {
        throw new Error("mediaId is required");
    }
    try {
        if (!MediaModel.sequelize) return null;
        const row = await MediaModel.findByPk(mediaId);
        if (!row) return null;
        const folderPath = row.folder_id ? await getFolderPathById(row.folder_id) : "";
        return {
            id: String(row.id),
            name: row.content_name,
            s3Key: row.s3_key,
            url: row.content_src || undefined,
            folderPath,
            contentType: row.mime_type || undefined,
        };
    } catch (err) {
        console.error("MediaService.getMediaById:", err);
        return null;
    }
}

/**
 * Delete a media item by id (and its S3 object).
 * @param {string} mediaId
 * @returns {Promise<{ deleted: boolean }>}
 */
export async function deleteMedia(mediaId) {
    if (!mediaId || typeof mediaId !== "string") {
        throw new Error("mediaId is required");
    }
    if (!MediaModel.sequelize) {
        throw new Error("Database not configured");
    }
    const row = await MediaModel.findByPk(mediaId);
    if (!row) {
        throw new Error("Media not found");
    }
    if (row.s3_key) {
        try {
            await deleteObjectFromS3(row.s3_key);
        } catch (e) {
            console.warn("MediaService.deleteMedia: S3 delete failed:", e.message);
        }
    }
    await row.destroy();
    return { deleted: true };
}
