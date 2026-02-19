import apiClient from "../apiClient.js";

export class EventsService {
  static async getAllEvents() {
    const response = await apiClient.get("/api/v1/events");
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
}
