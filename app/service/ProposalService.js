import apiClient from "../apiClient.js";

export class ProposalService {
  static async getAllProposals() {
    const response = await apiClient.get("/api/v1/proposals");
    return response.data;
  }

  static async getProposalById(idProposal) {
    const response = await apiClient.get(
      `/api/v1/proposals/${encodeURIComponent(idProposal)}`
    );
    return response.data;
  }
}

