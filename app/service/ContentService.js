import apiClient from "../apiClient.js";

export class ContentService{
    
    static async getAllContents(){
        const response = await apiClient.get('/api/v1/contents');
        return response.data;
    }

    static async getContentById(contentId){
        const response = await apiClient.get(`/api/v1/contents/${contentId}`);
        return response.data;
    }

    static async createContent(contentData){
        const response = await apiClient.post('/api/v1/contents', contentData);
        return response.data;
    }

    static async updateContent(contentId, contentData){
        const response = await apiClient.put(`/api/v1/contents/${contentId}`, contentData);
        return response.data;
    }

    static async deleteContent(contentId){
        const response = await apiClient.delete(`/api/v1/contents/${contentId}`);
        return response.data;
    }
}