import apiClient from "../apiClient.js";

export class EventsService {
  /**
   * @param {{ name?: string, region?: string, dateFrom?: string, dateTo?: string, portalNames?: string[] }} params
   */
  static async getAllEvents(params = {}) {
    const query = {};
    if (params.name) query.name = params.name;
    if (params.region) query.region = params.region;
    if (params.dateFrom) query.dateFrom = params.dateFrom;
    if (params.dateTo) query.dateTo = params.dateTo;
    if (Array.isArray(params.portalNames) && params.portalNames.length > 0) {
      query.portalNames = params.portalNames.join(",");
    }
    const response = await apiClient.get("/api/v1/events", { params: query });
    return response.data;
  }

  static async getEventById(idFair) {
    const response = await apiClient.get(`/api/v1/events/${encodeURIComponent(idFair)}`);
    return response.data;
  }

  static async createEvent(eventData) {
    const response = await apiClient.post("/api/v1/events", eventData);
    return response.data;
  }

  static async updateEvent(idFair, eventData) {
    const response = await apiClient.put(
      `/api/v1/events/${encodeURIComponent(idFair)}`,
      eventData
    );
    return response.data;
  }

  static async deleteEvent(idFair) {
    const response = await apiClient.delete(
      `/api/v1/events/${encodeURIComponent(idFair)}`
    );
    return response.data;
  }

  static async getEventPortals(idFair) {
    const response = await apiClient.get(
      `/api/v1/events/${encodeURIComponent(idFair)}/portals`
    );
    return response.data;
  }

  static async addEventToPortal(idFair, portalId) {
    const response = await apiClient.post(
      `/api/v1/events/${encodeURIComponent(idFair)}/portals`,
      { portalId: Number(portalId) }
    );
    return response.data;
  }

  static async removeEventFromPortal(idFair, portalId) {
    const response = await apiClient.delete(
      `/api/v1/events/${encodeURIComponent(idFair)}/portals/${portalId}`
    );
    return response.data;
  }
}
