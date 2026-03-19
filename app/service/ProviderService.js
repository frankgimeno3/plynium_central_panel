import apiClient from "../apiClient.js";

export class ProviderService {
  static async getAllProviders() {
    const response = await apiClient.get("/api/v1/providers");
    return response.data;
  }

  static async getProviderById(idProvider) {
    const response = await apiClient.get(
      `/api/v1/providers/${encodeURIComponent(idProvider)}`
    );
    return response.data;
  }

  static async getAllProviderInvoices() {
    const response = await apiClient.get("/api/v1/provider-invoices");
    return response.data;
  }

  static async getProviderInvoiceById(idInvoice) {
    const response = await apiClient.get(
      `/api/v1/provider-invoices/${encodeURIComponent(idInvoice)}`
    );
    return response.data;
  }

  static async updateProviderInvoice(idInvoice, payload) {
    const response = await apiClient.put(
      `/api/v1/provider-invoices/${encodeURIComponent(idInvoice)}`,
      payload
    );
    return response.data;
  }
}

