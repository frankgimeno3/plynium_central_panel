/**
 * Workflow state for a `publication_articles` row (magazine adaptation).
 * Values are stored verbatim in `publication_article_state` (VARCHAR + CHECK).
 */
export const PUBLICATION_ARTICLE_STATE_VALUES = Object.freeze([
  "unfinished",
  "awaiting materials",
  "finished unapproved",
  "finished approved",
]);

/** State required before the issue can be published. */
export const PUBLICATION_ARTICLE_STATE_PUBLISH_REQUIRED = "finished approved";

/**
 * @param {unknown} raw
 * @returns {typeof PUBLICATION_ARTICLE_STATE_VALUES[number]}
 */
export function normalizePublicationArticleState(raw) {
  const s = String(raw ?? "").trim();
  return PUBLICATION_ARTICLE_STATE_VALUES.includes(s) ? s : "unfinished";
}
