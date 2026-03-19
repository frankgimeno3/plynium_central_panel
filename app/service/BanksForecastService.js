import apiClient from "../apiClient.js";

export class BanksForecastService {
  static async getAllForecastedItems() {
    const response = await apiClient.get("/api/v1/banks-forecasted-items");
    return response.data;
  }

  static async getForecastedItemById(id) {
    const response = await apiClient.get(
      `/api/v1/banks-forecasted-items/${encodeURIComponent(id)}`
    );
    return response.data;
  }

  static async updateForecastedItem(id, payload) {
    const response = await apiClient.put(
      `/api/v1/banks-forecasted-items/${encodeURIComponent(id)}`,
      payload
    );
    return response.data;
  }

  static async createForecastedItem(payload) {
    const response = await apiClient.post("/api/v1/banks-forecasted-items", payload);
    return response.data;
  }
}

