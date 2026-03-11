import apiClient from "../apiClient.js";

export class CompanyCategoryService {
  static async getAllCategories() {
    const response = await apiClient.get("/api/v1/company-categories");
    return response.data;
  }

  static async getCategoryById(idCategory) {
    const response = await apiClient.get(
      `/api/v1/company-categories/${encodeURIComponent(idCategory)}`
    );
    return response.data;
  }

  static async createCategory(data) {
    const response = await apiClient.post("/api/v1/company-categories", data);
    return response.data;
  }
}
