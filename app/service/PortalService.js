import apiClient from "../apiClient.js";

export class PortalService {
    static async getAllPortals() {
        const response = await apiClient.get("/api/v1/portals");
        return response.data;
    }

    static async getNewsletterCampaignsForPortal(portalId) {
        const response = await apiClient.get(
            `/api/v1/portals/${encodeURIComponent(String(portalId))}/newsletter-campaigns`
        );
        return response.data;
    }
}
