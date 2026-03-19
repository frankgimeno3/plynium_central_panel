import apiClient from "../apiClient.js";

/**
 * @param {string} [path=""] - Folder path to list children for.
 * @returns {Promise<Array<{ id: string, name: string, path: string }>>}
 */
export function getFolders(path = "") {
    const params = path ? { path } : {};
    return apiClient.get("/api/v1/folders", { params }).then((r) => r.data);
}

/**
 * @param {{ name: string, path?: string }} data
 * @returns {Promise<{ id: string, name: string, path: string }>}
 */
export function createFolder(data) {
    return apiClient.post("/api/v1/folders", data).then((r) => r.data);
}

/**
 * @param {{ folderPath?: string, search?: string }} [params={}]
 * @returns {Promise<Array<{ id: string, name: string, s3Key: string, url?: string, folderPath: string }>>}
 */
export function getMedia(params = {}) {
    const query = {};
    if (params.folderPath != null) query.folderPath = params.folderPath;
    if (params.search != null) query.search = params.search;
    return apiClient.get("/api/v1/media", { params: query }).then((r) => r.data);
}

/**
 * @param {{ filename: string, contentType?: string }} data
 * @returns {Promise<{ uploadUrl: string, mediaId: string, s3Key: string, cdnUrl?: string }>}
 */
export function createPresign(data) {
    return apiClient.post("/api/v1/media/presign", data).then((r) => r.data);
}

/**
 * @param {{ mediaId: string, name?: string, contentName?: string, s3Key: string, folderPath?: string, folderId?: string, cdnUrl?: string, contentType?: string, type?: 'pdf' | 'image' }} data
 * @returns {Promise<{ id: string, name: string, s3Key: string, folderPath: string }>}
 */
export function createMedia(data) {
    return apiClient.post("/api/v1/media", data).then((r) => r.data);
}

/**
 * @param {string} mediaId
 * @returns {Promise<{ id: string, name: string, s3Key: string, url?: string, folderPath: string, contentType?: string } | null>}
 */
export function getMediaById(mediaId) {
    return apiClient.get(`/api/v1/media/${mediaId}`).then((r) => r.data);
}

/**
 * @param {string} mediaId
 * @returns {Promise<{ deleted: boolean }>}
 */
export function deleteMedia(mediaId) {
    return apiClient.delete(`/api/v1/media/${mediaId}`).then((r) => r.data);
}

/**
 * @param {string} path - Folder path (e.g. "a" or "a/b").
 * @returns {Promise<{ id: string, name: string, path: string } | null>}
 */
export function getFolderByPath(path) {
    return apiClient.get("/api/v1/folders/by-path", { params: { path } }).then((r) => r.data);
}

/**
 * @param {string} folderId
 * @param {{ name: string }} data
 * @returns {Promise<{ id: string, name: string, path: string }>}
 */
export function updateFolder(folderId, data) {
    return apiClient.patch(`/api/v1/folders/${folderId}`, data).then((r) => r.data);
}

/**
 * @param {string} folderId
 * @returns {Promise<{ deleted: boolean }>}
 */
export function deleteFolder(folderId) {
    return apiClient.delete(`/api/v1/folders/${folderId}`).then((r) => r.data);
}
