import apiClient from "../apiClient.js";

export class ServiceGroupService {
    static async getAllServiceGroups() {
        const response = await apiClient.get("/api/v1/service-groups");
        return response.data;
    }

    static async getServiceGroupById(serviceGroupId) {
        const response = await apiClient.get(
            `/api/v1/service-groups/${encodeURIComponent(serviceGroupId)}`
        );
        return response.data;
    }

    static async createServiceGroup(data) {
        const response = await apiClient.post("/api/v1/service-groups", data);
        return response.data;
    }
}
