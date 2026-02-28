import apiClient from "../apiClient.js";

export class ProductService {
    static async getAllProducts() {
        const response = await apiClient.get("/api/v1/products");
        return response.data;
    }

    static async getProductsByCompany(companyId) {
        if (!companyId?.trim()) return [];
        const response = await apiClient.get("/api/v1/products", {
            params: { companyId: companyId.trim() },
        });
        return response.data;
    }

    static async getProductById(idProduct) {
        const response = await apiClient.get(`/api/v1/products/${idProduct}`);
        return response.data;
    }

    static async createProduct(productData) {
        const response = await apiClient.post("/api/v1/products", productData);
        return response.data;
    }

    static async updateProduct(idProduct, productData) {
        const response = await apiClient.put(`/api/v1/products/${idProduct}`, productData);
        return response.data;
    }

    static async deleteProduct(idProduct) {
        const response = await apiClient.delete(`/api/v1/products/${idProduct}`);
        return response.data;
    }

    static async getProductPortals(idProduct) {
        const response = await apiClient.get(`/api/v1/products/${encodeURIComponent(idProduct)}/portals`);
        return response.data;
    }

    static async addProductToPortal(idProduct, portalId) {
        const response = await apiClient.post(`/api/v1/products/${encodeURIComponent(idProduct)}/portals`, {
            portalId: Number(portalId),
        });
        return response.data;
    }

    static async removeProductFromPortal(idProduct, portalId) {
        const response = await apiClient.delete(
            `/api/v1/products/${encodeURIComponent(idProduct)}/portals/${portalId}`
        );
        return response.data;
    }
}
