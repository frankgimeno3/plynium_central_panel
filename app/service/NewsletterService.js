import apiClient from "../apiClient.js";

export class NewsletterService {
  static async getNewsletterCampaigns() {
    const response = await apiClient.get("/api/v1/newsletter-campaigns");
    return response.data;
  }

  static async getNewsletters() {
    const response = await apiClient.get("/api/v1/newsletters");
    return response.data;
  }

  static async getNewsletterById(idNewsletter) {
    const response = await apiClient.get(`/api/v1/newsletters/${encodeURIComponent(idNewsletter)}`);
    return response.data;
  }

  static async getNewsletterBlocks(idNewsletter) {
    const response = await apiClient.get(
      `/api/v1/newsletters/${encodeURIComponent(idNewsletter)}/blocks`
    );
    return response.data;
  }

  static async updateNewsletterStatus(idNewsletter, { status, userNewsletterListId }) {
    const response = await apiClient.put(
      `/api/v1/newsletters/${encodeURIComponent(idNewsletter)}`,
      {
        status,
        userNewsletterListId: userNewsletterListId ?? null,
      }
    );
    return response.data;
  }

  static async updateNewsletterContentBlock(idNewsletter, idBlock, { blockType, order, data }) {
    const response = await apiClient.put(
      `/api/v1/newsletters/${encodeURIComponent(idNewsletter)}/blocks/${encodeURIComponent(idBlock)}`,
      {
        block_type: blockType,
        block_order: order,
        data,
      }
    );
    return response.data;
  }

  static async createNewsletter(idNewsletter, { idCampaign, portalCode, estimatedPublishDate, topic, status, userNewsletterListId }) {
    const response = await apiClient.post("/api/v1/newsletters", {
      id_newsletter: idNewsletter,
      id_campaign: idCampaign,
      portal_code: portalCode,
      estimated_publish_date: estimatedPublishDate ?? null,
      topic,
      status,
      user_newsletter_list_id: userNewsletterListId ?? null,
    });
    return response.data;
  }
}

