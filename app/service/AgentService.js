import apiClient from "../apiClient.js";

export class AgentService {
  static async getAllAgents() {
    const response = await apiClient.get("/api/v1/agents");
    return response.data;
  }

  static async getAgentById(idAgent) {
    const response = await apiClient.get(
      `/api/v1/agents/${encodeURIComponent(idAgent)}`
    );
    return response.data;
  }
}
