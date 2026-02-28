import apiClient from "../apiClient.js";

export class PublicationService{
    /**
     * @param {{ portalNames?: string[] }} params - If provided, only publications visible in at least one of these portals (by name) are returned.
     */
    static async getAllPublications(params = {}) {
        const portalNames = Array.isArray(params.portalNames) ? params.portalNames.filter(Boolean) : [];
        const query = portalNames.length > 0 ? { portalNames: portalNames.join(",") } : {};
        const response = await apiClient.get("/api/v1/publications", { params: query });
        return response.data;
    }

    static async getPublicationById(idPublication){
        const response = await apiClient.get(`/api/v1/publications/${idPublication}`);
        return response.data;
    }

    static async createPublication(publicationData){
        const response = await apiClient.post('/api/v1/publications', publicationData);
        return response.data;
    }

    static async updatePublication(idPublication, publicationData){
        const response = await apiClient.put(`/api/v1/publications/${idPublication}`, publicationData);
        return response.data;
    }

    static async deletePublication(idPublication){
        const response = await apiClient.delete(`/api/v1/publications/${idPublication}`);
        return response.data;
    }

    static async getPublicationPortals(idPublication) {
        const response = await apiClient.get(`/api/v1/publications/${idPublication}/portals`);
        return response.data;
    }

    static async addPublicationToPortal(idPublication, portalId) {
        const response = await apiClient.post(`/api/v1/publications/${idPublication}/portals`, {
            portalId: Number(portalId),
        });
        return response.data;
    }

    static async removePublicationFromPortal(idPublication, portalId) {
        const response = await apiClient.delete(
            `/api/v1/publications/${idPublication}/portals/${portalId}`
        );
        return response.data;
    }
}