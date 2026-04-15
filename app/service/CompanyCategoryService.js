import apiClient from "../apiClient.js";

function normalizeCategory(raw) {
  if (!raw || typeof raw !== "object") return null;
  const category_id =
    raw.category_id ?? raw.id_category ?? raw.categoryId ?? raw.idCategory;
  const category_name =
    raw.category_name ?? raw.name ?? raw.categoryName;
  const category_description =
    raw.category_description ?? raw.description ?? raw.categoryDescription;
  const portals_array =
    raw.portals_array ??
    raw.portalsArray ??
    raw.category_portals_array ??
    raw.categoryPortalsArray ??
    [];
  const portal_ids = raw.portal_ids ?? raw.portalIds ?? [];

  if (typeof category_id !== "string" || category_id.trim().length === 0) return null;
  return {
    category_id,
    category_name: typeof category_name === "string" ? category_name : "",
    category_description: typeof category_description === "string" ? category_description : "",
    portals_array: Array.isArray(portals_array) ? portals_array.filter((p) => typeof p === "string") : [],
    portal_ids: Array.isArray(portal_ids) ? portal_ids.filter((x) => Number.isInteger(x) && x >= 0) : [],
  };
}

export class CompanyCategoryService {
  static async getAllCategories() {
    const response = await apiClient.get("/api/v1/company-categories");
    const list = response.data;
    if (!Array.isArray(list)) return [];
    return list.map(normalizeCategory).filter(Boolean);
  }

  static async getCategoryById(idCategory) {
    const response = await apiClient.get(
      `/api/v1/company-categories/${encodeURIComponent(idCategory)}`
    );
    return normalizeCategory(response.data);
  }

  static async createCategory(data) {
    const response = await apiClient.post("/api/v1/company-categories", data);
    return normalizeCategory(response.data);
  }

  static async deleteCategory(idCategory) {
    const response = await apiClient.delete(
      `/api/v1/company-categories/${encodeURIComponent(idCategory)}`
    );
    return normalizeCategory(response.data);
  }

  static async updateCategoryPortals(idCategory, portalIds) {
    const response = await apiClient.patch(
      `/api/v1/company-categories/${encodeURIComponent(idCategory)}/portals`,
      { portal_ids: Array.isArray(portalIds) ? portalIds : [] }
    );
    return normalizeCategory(response.data);
  }
}
