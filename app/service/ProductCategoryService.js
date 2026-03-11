import apiClient from "../apiClient.js";

export class ProductCategoryService {
  static async getAllCategories() {
    const response = await apiClient.get("/api/v1/product-categories");
    return response.data;
  }

  static async getCategoryById(idCategory) {
    const response = await apiClient.get(
      `/api/v1/product-categories/${encodeURIComponent(idCategory)}`
    );
    return response.data;
  }

  static async createCategory(data) {
    const response = await apiClient.post("/api/v1/product-categories", data);
    return response.data;
  }
}
