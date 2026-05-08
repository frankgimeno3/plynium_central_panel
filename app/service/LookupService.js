import apiClient from "../apiClient.js";

export class LookupService {
  /**
   * @param {string} email
   * @returns {Promise<{
   *   email: string;
   *   customers: Array<{ id: string; label: string }>;
   *   contacts: Array<{ id: string; label: string }>;
   *   companies: Array<{ id: string; label: string }>;
   *   users: Array<{ id: string; label: string; email: string }>;
   * }>}
   */
  static async getEmailMatches(email) {
    const response = await apiClient.get("/api/v1/lookup/email-matches", {
      params: { email: String(email ?? "").trim() },
    });
    return response.data;
  }
}
