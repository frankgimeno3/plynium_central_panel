import apiClient from "../apiClient.js";

export class PortalService {
    static async getAllPortals() {
        const response = await apiClient.get("/api/v1/portals");
        return response.data;
    }
}
