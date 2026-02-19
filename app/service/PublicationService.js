import apiClient from "../apiClient.js";

export class PublicationService{
    static async getAllPublications(){
        const response = await apiClient.get('/api/v1/publications');
        return response.data;
    }

    static async getPublicationById(idPublication){
        const response = await apiClient.get(`/api/v1/publications/${idPublication}`);
        return response.data;
    }

    static async createPublication(publicationData){
        const response = await apiClient.post('/api/v1/publications', publicationData);
        return response.data;
    }

    static async updatePublication(idPublication, publicationData){
        const response = await apiClient.put(`/api/v1/publications/${idPublication}`, publicationData);
        return response.data;
    }

    static async deletePublication(idPublication){
        const response = await apiClient.delete(`/api/v1/publications/${idPublication}`);
        return response.data;
    }
}