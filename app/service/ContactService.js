import apiClient from "../apiClient.js";

export class ContactService {
  static async getAllContacts() {
    const response = await apiClient.get("/api/v1/contacts");
    return response.data;
  }

  static async getContactById(idContact) {
    const response = await apiClient.get(
      `/api/v1/contacts/${encodeURIComponent(idContact)}`
    );
    return response.data;
  }

  static async createContact(data) {
    const response = await apiClient.post("/api/v1/contacts", data);
    return response.data;
  }

  static async updateContact(idContact, data) {
    const response = await apiClient.patch(
      `/api/v1/contacts/${encodeURIComponent(idContact)}`,
      data
    );
    return response.data;
  }

  static async deleteContact(idContact) {
    const response = await apiClient.delete(
      `/api/v1/contacts/${encodeURIComponent(idContact)}`
    );
    return response.data;
  }
}
