import apiClient from "../apiClient.js";

/**
 * @param {{ portalNames?: string[] }} params - If provided, only articles published in at least one of these portals (by name) are returned.
 */
export function getAllArticles(params = {}) {
    const portalNames = Array.isArray(params.portalNames) ? params.portalNames.filter(Boolean) : [];
    const query = portalNames.length > 0 ? { portalNames: portalNames.join(",") } : {};
    return apiClient.get("/api/v1/articles", { params: query }).then((r) => r.data);
}

export class ArticleService {
    static getAllArticles = getAllArticles;

    static async getArticleById(idArticle) {
        const response = await apiClient.get(`/api/v1/articles/${idArticle}`);
        return response.data;
    }

    static async createArticle(articleData) {
        const response = await apiClient.post("/api/v1/articles", articleData);
        return response.data;
    }

    static async updateArticle(idArticle, articleData) {
        const response = await apiClient.put(`/api/v1/articles/${idArticle}`, articleData);
        return response.data;
    }

    static async deleteArticle(idArticle) {
        const response = await apiClient.delete(`/api/v1/articles/${idArticle}`);
        return response.data;
    }

    static async getArticlePublications(idArticle) {
        const response = await apiClient.get(`/api/v1/articles/${idArticle}/publications`);
        return response.data;
    }

    static async addArticleToPortal(idArticle, portalId) {
        const response = await apiClient.post(`/api/v1/articles/${idArticle}/publications`, {
            portalId: Number(portalId),
        });
        return response.data;
    }

    static async removeArticleFromPortal(idArticle, portalId) {
        const response = await apiClient.delete(
            `/api/v1/articles/${idArticle}/publications/${portalId}`
        );
        return response.data;
    }
}