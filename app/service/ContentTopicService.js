import apiClient from "../apiClient.js";

function normalizeTopic(raw) {
  if (!raw || typeof raw !== "object") return null;
  const topic_id = raw.topic_id ?? raw.topicId;
  if (topic_id == null || !Number.isFinite(Number(topic_id))) return null;
  const tp = raw.topic_portal ?? raw.topicPortal;
  const portalIdsRaw = raw.topic_portal_ids ?? raw.topicPortalIds ?? raw.portal_ids ?? raw.portalIds;
  const topic_portal_ids = Array.isArray(portalIdsRaw)
    ? portalIdsRaw
        .map((n) => (Number.isFinite(Number(n)) ? Number(n) : null))
        .filter((n) => Number.isInteger(n) && n >= 0)
    : undefined;
  return {
    topic_id: Number(topic_id),
    // legacy: topic_portal puede desaparecer; preferir topic_portal_ids
    topic_portal: tp != null && Number.isFinite(Number(tp)) ? Number(tp) : null,
    topic_portal_ids,
    topic_name: typeof raw.topic_name === "string" ? raw.topic_name : String(raw.topic_name ?? ""),
    topic_description:
      typeof raw.topic_description === "string" ? raw.topic_description : String(raw.topic_description ?? ""),
    topic_created_at: raw.topic_created_at ?? raw.topicCreatedAt ?? null,
    topic_updated_at: raw.topic_updated_at ?? raw.topicUpdatedAt ?? null,
  };
}

export class ContentTopicService {
  static async getTopics(portalId) {
    const params = {};
    if (portalId != null && Number.isFinite(Number(portalId))) {
      params.portal_id = Number(portalId);
    }
    const response = await apiClient.get("/api/v1/topics", { params });
    const list = response.data;
    if (!Array.isArray(list)) return [];
    return list.map(normalizeTopic).filter(Boolean);
  }

  static async getTopicById(topicId, portalId) {
    const params = {};
    if (portalId != null && Number.isFinite(Number(portalId))) {
      params.portal_id = Number(portalId);
    }
    const response = await apiClient.get(`/api/v1/topics/${encodeURIComponent(String(topicId))}`, { params });
    return normalizeTopic(response.data);
  }

  static async updateTopic(topicId, patch) {
    const response = await apiClient.patch(`/api/v1/topics/${encodeURIComponent(String(topicId))}`, patch ?? {});
    return normalizeTopic(response.data);
  }

  static async createTopic(payload) {
    const response = await apiClient.post(`/api/v1/topics`, payload ?? {});
    return normalizeTopic(response.data);
  }
}
