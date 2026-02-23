import apiClient from "../apiClient.js";

export class BannerService {
    static async getBannersByPortalId(portalId) {
        const response = await apiClient.get("/api/v1/banners", { params: { portalId } });
        return response.data;
    }

    static async getBannerById(id) {
        const response = await apiClient.get(`/api/v1/banners/${encodeURIComponent(id)}`);
        return response.data;
    }

    static async createBanner(bannerData) {
        const response = await apiClient.post("/api/v1/banners", bannerData);
        return response.data;
    }

    static async updateBanner(id, bannerData) {
        const response = await apiClient.put(`/api/v1/banners/${encodeURIComponent(id)}`, bannerData);
        return response.data;
    }

    static async deleteBanner(id) {
        const response = await apiClient.delete(`/api/v1/banners/${encodeURIComponent(id)}`);
        return response.data;
    }
}
