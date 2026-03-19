import apiClient from "../apiClient.js";

export class PmEventService {
  static async getAllPmEvents() {
    const response = await apiClient.get("/api/v1/pm-events");
    return response.data;
  }

  static async getPmEventById(idEvent) {
    const response = await apiClient.get(
      `/api/v1/pm-events/${encodeURIComponent(idEvent)}`
    );
    return response.data;
  }

  static async getPmEventsByProjectId(idProject) {
    const response = await apiClient.get(
      "/api/v1/pm-events",
      { params: { id_project: idProject } }
    );
    return response.data;
  }

  static async getPmEventsByCustomerId(idCustomer) {
    const response = await apiClient.get(
      "/api/v1/pm-events",
      { params: { id_customer: idCustomer } }
    );
    return response.data;
  }
}
