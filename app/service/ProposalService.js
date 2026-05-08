import apiClient from "../apiClient.js";

export const ProposalService = {
  async getAllProposals() {
    const response = await apiClient.get("/api/v1/proposals");
    return response.data;
  },

  async getProposalById(idProposal) {
    const response = await apiClient.get(
      `/api/v1/proposals/${encodeURIComponent(idProposal)}`
    );
    return response.data;
  },

  async createProposal(data) {
    const response = await apiClient.post("/api/v1/proposals", data);
    return response.data;
  },

  async updateProposal(idProposal, data) {
    const response = await apiClient.patch(
      `/api/v1/proposals/${encodeURIComponent(idProposal)}`,
      data
    );
    return response.data;
  },

  /** Mark proposal accepted and create contract + one project per service line. */
  async acceptProposal(idProposal, data) {
    const response = await apiClient.post(
      `/api/v1/proposals/${encodeURIComponent(idProposal)}/accept`,
      { contract_title: data?.contract_title ?? "" }
    );
    return response.data;
  },
};

export default ProposalService;

