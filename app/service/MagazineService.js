import apiClient from "../apiClient.js";

export class MagazineService {
  static async getAllMagazines() {
    const response = await apiClient.get("/api/v1/magazines");
    return response.data;
  }

  static async getMagazineById(idMagazine) {
    const response = await apiClient.get(`/api/v1/magazines/${encodeURIComponent(idMagazine)}`);
    return response.data;
  }

  static async createMagazine(data) {
    const response = await apiClient.post("/api/v1/magazines", data);
    return response.data;
  }

  static async updateMagazine(idMagazine, data) {
    const response = await apiClient.patch(`/api/v1/magazines/${encodeURIComponent(idMagazine)}`, data);
    return response.data;
  }
}
