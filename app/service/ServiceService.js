import apiClient from "../apiClient.js";

export class ServiceService {
  static async getAllServices() {
    const response = await apiClient.get("/api/v1/services");
    return response.data;
  }

  static async getServiceById(idService) {
    const response = await apiClient.get(
      `/api/v1/services/${encodeURIComponent(idService)}`
    );
    return response.data;
  }

  static async updateService(idService, serviceData) {
    const response = await apiClient.patch(
      `/api/v1/services/${encodeURIComponent(idService)}`,
      serviceData
    );
    return response.data;
  }
}
