import apiClient from "../apiClient.js";

export class ContractService {
  static async getAllContracts() {
    const response = await apiClient.get("/api/v1/contracts");
    return response.data;
  }

  static async getContractById(idContract) {
    const response = await apiClient.get(
      `/api/v1/contracts/${encodeURIComponent(idContract)}`
    );
    return response.data;
  }
}

