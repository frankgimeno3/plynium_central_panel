import apiClient from "../apiClient.js";

export class ProjectService {
  static async getAllProjects() {
    const response = await apiClient.get("/api/v1/projects");
    return response.data;
  }

  static async getProjectById(idProject) {
    const response = await apiClient.get(
      `/api/v1/projects/${encodeURIComponent(idProject)}`
    );
    return response.data;
  }
}

