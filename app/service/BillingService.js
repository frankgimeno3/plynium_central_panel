import apiClient from "../apiClient.js";

export class BillingService {
  static async getAllIssuedInvoices() {
    const response = await apiClient.get("/api/v1/issued-invoices");
    return response.data;
  }

  static async getIssuedInvoiceById(idInvoice) {
    const response = await apiClient.get(
      `/api/v1/issued-invoices/${encodeURIComponent(idInvoice)}`
    );
    return response.data;
  }

  static async getAllOrders() {
    const response = await apiClient.get("/api/v1/orders");
    return response.data;
  }

  static async getOrderById(idOrder) {
    const response = await apiClient.get(
      `/api/v1/orders/${encodeURIComponent(idOrder)}`
    );
    return response.data;
  }

  static async updateOrder(idOrder, payload) {
    const response = await apiClient.put(
      `/api/v1/orders/${encodeURIComponent(idOrder)}`,
      payload
    );
    return response.data;
  }
}

