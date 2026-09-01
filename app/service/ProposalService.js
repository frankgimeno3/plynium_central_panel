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

  /** Create or update a proposal with status draft (wizard progress). */
  async saveDraftProposal(idProposal, data, { alreadyPersisted = false } = {}) {
    const proposalFase =
      data?.proposal_fase != null && String(data.proposal_fase).trim() !== ""
        ? String(data.proposal_fase).trim()
        : "1";
    const body = { ...data, status: "draft", proposal_fase: proposalFase };
    if (alreadyPersisted) {
      return this.updateProposal(idProposal, body);
    }
    return this.createProposal({ ...body, id_proposal: idProposal });
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

