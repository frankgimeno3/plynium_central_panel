import apiClient from "../apiClient.js";

export class ArticleService{
    static async getAllArticles(){
        const response = await apiClient.get('/api/v1/articles');
        return response.data;
    }

    static async getArticleById(idArticle){
        const response = await apiClient.get(`/api/v1/articles/${idArticle}`);
        return response.data;
    }

    static async createArticle(articleData){
        const response = await apiClient.post('/api/v1/articles', articleData);
        return response.data;
    }

    static async updateArticle(idArticle, articleData){
        const response = await apiClient.put(`/api/v1/articles/${idArticle}`, articleData);
        return response.data;
    }

    static async deleteArticle(idArticle){
        const response = await apiClient.delete(`/api/v1/articles/${idArticle}`);
        return response.data;
    }
}