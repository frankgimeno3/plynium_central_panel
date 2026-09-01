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

    /** All publications_db rows for a magazine (admin). */
    static async listPublicationsForMagazine(magazineId) {
        const response = await apiClient.get(
            `/api/v1/magazines/${encodeURIComponent(magazineId)}/publications`
        );
        return response.data;
    }

    /**
     * @param {string} publicationId
     * @param {{ service_group_id: string, position_in_magazine: string }} params
     */
    static async getPreferentialSlotAvailability(publicationId, params) {
        const q = new URLSearchParams({
            service_group_id: String(params.service_group_id ?? ""),
            position_in_magazine: String(params.position_in_magazine ?? ""),
        }).toString();
        const response = await apiClient.get(
            `/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots/availability?${q}`
        );
        return response.data;
    }

    /** Ordered preferential slots for a publication (cover, inside, pages 1–9, end). */
    static async listPreferentialSlotsForPublication(publicationId, ensure = true) {
        const response = await apiClient.get(
            `/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots?ensure=${ensure ? "true" : "false"}`
        );
        return response.data;
    }

    /**
     * Sold / offered state for magazine catalog services on a publication (from proposal_service_lines).
     * @param {string} publicationId
     * @returns {Promise<{ publication_id: string, by_service_id: Record<string, 'sold' | 'offered'> }>}
     */
    static async getMagazineServiceAvailability(publicationId) {
        const response = await apiClient.get(
            `/api/v1/publications/${encodeURIComponent(publicationId)}/magazine-service-availability`
        );
        return response.data;
    }

    /** Creates a draft row in publications_db for a planned issue. */
    static async createMagazinePublication(magazineId, body) {
        const response = await apiClient.post(
            `/api/v1/magazines/${encodeURIComponent(magazineId)}/publications`,
            body
        );
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