import apiClient from "../apiClient.js";

export class CompanyService {
    static async getAllCompanies() {
        const response = await apiClient.get("/api/v1/companies");
        return response.data;
    }

    static async getCompanyById(idCompany) {
        const response = await apiClient.get(`/api/v1/companies/${idCompany}`);
        return response.data;
    }

    static async createCompany(companyData) {
        const response = await apiClient.post("/api/v1/companies", companyData);
        return response.data;
    }

    static async updateCompany(idCompany, companyData) {
        const response = await apiClient.put(`/api/v1/companies/${idCompany}`, companyData);
        return response.data;
    }

    static async deleteCompany(idCompany) {
        const response = await apiClient.delete(`/api/v1/companies/${idCompany}`);
        return response.data;
    }

    static async getCompanyPortals(idCompany) {
        const response = await apiClient.get(`/api/v1/companies/${encodeURIComponent(idCompany)}/portals`);
        return response.data;
    }

    static async addCompanyToPortal(idCompany, portalId) {
        const response = await apiClient.post(`/api/v1/companies/${encodeURIComponent(idCompany)}/portals`, {
            portalId: Number(portalId),
        });
        return response.data;
    }

    static async removeCompanyFromPortal(idCompany, portalId) {
        const response = await apiClient.delete(
            `/api/v1/companies/${encodeURIComponent(idCompany)}/portals/${portalId}`
        );
        return response.data;
    }
}
