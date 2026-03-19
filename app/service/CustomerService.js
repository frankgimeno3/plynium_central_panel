import apiClient from "../apiClient.js";

export class CustomerService {
  static async getAllCustomers() {
    const response = await apiClient.get("/api/v1/customers");
    return response.data;
  }

  static async getCustomerById(idCustomer) {
    const response = await apiClient.get(
      `/api/v1/customers/${encodeURIComponent(idCustomer)}`
    );
    return response.data;
  }

  static async createCustomer(data) {
    const response = await apiClient.post("/api/v1/customers", data);
    return response.data;
  }

  static async updateCustomer(idCustomer, data) {
    const response = await apiClient.patch(
      `/api/v1/customers/${encodeURIComponent(idCustomer)}`,
      data
    );
    return response.data;
  }
}
