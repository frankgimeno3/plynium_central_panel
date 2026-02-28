import Database from "../../database/database.js";

/**
 * Get portals (with publication id) where an article is published.
 * @param {string} articleId - articles.id_article
 * @returns {Promise<Array<{ id: string, portalId: number, portalName: string, slug: string, status: string }>>}
 */
export async function getPublicationsByArticleId(articleId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT ap.id, ap.portal_id AS "portalId", p.name AS "portalName", ap.slug, ap.status, ap.highlight_position AS "highlightPosition"
         FROM article_publications ap
         JOIN portals p ON p.id = ap.portal_id
         WHERE ap.article_id = :articleId
         ORDER BY p.name`,
        { replacements: { articleId } }
    );
    return (rows || []).map((r) => ({
        id: r.id,
        portalId: r.portalId,
        portalName: r.portalName,
        slug: r.slug,
        status: r.status,
        highlightPosition: r.highlightPosition ?? "",
    }));
}

/**
 * Get effective highlight_position for an article (for display when single publication).
 * @param {string} articleId
 * @returns {Promise<string>}
 */
export async function getEffectiveHighlightPosition(articleId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return "";
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT highlight_position FROM article_publications WHERE article_id = :articleId AND (highlight_position IS NOT NULL AND highlight_position != '') LIMIT 1`,
        { replacements: { articleId } }
    );
    return (rows?.[0]?.highlight_position ?? "").trim();
}

/**
 * Add article to a portal (creates article_publications row).
 * Slug is derived from articleId for uniqueness per portal.
 */
export async function addArticleToPortal(articleId, portalId, articleTitle = "") {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const slug = (articleTitle || articleId)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "") || articleId.replace(/_/g, "-");
    const baseSlug = slug || articleId.replace(/_/g, "-");
    const [existing] = await sequelize.query(
        `SELECT 1 FROM article_publications WHERE article_id = :articleId AND portal_id = :portalId`,
        { replacements: { articleId, portalId } }
    );
    if (existing && existing.length > 0) {
        return getPublicationsByArticleId(articleId);
    }
    let finalSlug = baseSlug;
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM article_publications WHERE portal_id = :portalId AND slug = :slug`,
            { replacements: { portalId, slug: finalSlug } }
        );
        if (!collision || collision.length === 0) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO article_publications (article_id, portal_id, slug, status, visibility, commenting_enabled)
         VALUES (:articleId, :portalId, :slug, 'published', 'public', true)`,
        {
            replacements: {
                articleId,
                portalId,
                slug: finalSlug,
            },
        }
    );
    return getPublicationsByArticleId(articleId);
}

/**
 * Remove article from a portal (deletes article_publications row).
 */
export async function removeArticleFromPortal(articleId, portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const [result] = await sequelize.query(
        `DELETE FROM article_publications WHERE article_id = :articleId AND portal_id = :portalId`,
        { replacements: { articleId, portalId } }
    );
    return getPublicationsByArticleId(articleId);
}

/**
 * Set highlight_position for an article in a specific portal.
 * Clears any other article_publication in the SAME portal that had this position.
 * @param {string} articleId
 * @param {number} portalId
 * @param {string} highlightPosition - e.g. "Main article", "Position1", etc.
 */
export async function setHighlightPositionInPortal(articleId, portalId, highlightPosition) {
    const pos = (highlightPosition || "").trim();
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    if (pos) {
        await sequelize.query(
            `UPDATE article_publications SET highlight_position = '' 
             WHERE portal_id = :portalId AND highlight_position = :pos`,
            { replacements: { portalId, pos } }
        );
    }
    await sequelize.query(
        `UPDATE article_publications SET highlight_position = :pos 
         WHERE article_id = :articleId AND portal_id = :portalId`,
        { replacements: { articleId, portalId, pos } }
    );
}

/**
 * Get highlighted articles for a portal. One row per highlight_position (Main article, Position1, etc.).
 * @param {number} portalId
 * @returns {Promise<Array<{ highlightPosition: string, articleId: string, articleTitle: string, article_main_image_url: string }>>}
 */
export async function getHighlightedArticlesByPortal(portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT ap.highlight_position AS "highlightPosition", a.id_article AS "articleId", a.article_title AS "articleTitle", a.article_main_image_url
         FROM article_publications ap
         JOIN articles a ON a.id_article = ap.article_id
         WHERE ap.portal_id = :portalId AND ap.highlight_position IS NOT NULL AND TRIM(ap.highlight_position) != ''
         ORDER BY ap.highlight_position`,
        { replacements: { portalId } }
    );
    return (rows || []).map((r) => ({
        highlightPosition: (r.highlightPosition ?? "").trim(),
        articleId: r.articleId ?? "",
        articleTitle: r.articleTitle ?? "",
        article_main_image_url: r.article_main_image_url ?? "",
    }));
}

const HIGHLIGHT_POSITIONS = ["Main article", "Position1", "Position2", "Position3", "Position4", "Position5"];

/**
 * Get all highlight positions (for building table rows).
 * @returns {string[]}
 */
export function getHighlightPositions() {
    return [...HIGHLIGHT_POSITIONS];
}

/**
 * Set the highlighted article for a position in a portal. Adds article to portal if not already.
 * @param {number} portalId
 * @param {string} highlightPosition
 * @param {string} articleId
 */
export async function setHighlightedArticleForPosition(portalId, highlightPosition, articleId) {
    const pos = (highlightPosition || "").trim();
    const aid = (articleId || "").trim();
    if (!pos || !aid) throw new Error("highlightPosition and articleId are required");
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const [existing] = await sequelize.query(
        `SELECT 1 FROM article_publications WHERE article_id = :articleId AND portal_id = :portalId`,
        { replacements: { articleId: aid, portalId } }
    );
    if (!existing || existing.length === 0) {
        const [articleRow] = await sequelize.query(
            `SELECT article_title FROM articles WHERE id_article = :articleId`,
            { replacements: { articleId: aid } }
        );
        const articleTitle = articleRow?.[0]?.article_title ?? "";
        await addArticleToPortal(aid, portalId, articleTitle);
    }
    await setHighlightPositionInPortal(aid, portalId, pos);
}

/**
 * Create article_publications rows for each portalId. Slug per portal from articleId.
 */
export async function createArticlePublications(articleId, portalIds, articleTitle = "") {
    if (!Array.isArray(portalIds) || portalIds.length === 0) return;
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    const baseSlug =
        (articleTitle || articleId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || articleId.replace(/_/g, "-");
    for (const portalId of portalIds) {
        let finalSlug = baseSlug;
        let suffix = 0;
        for (;;) {
            const [collision] = await sequelize.query(
                `SELECT 1 FROM article_publications WHERE portal_id = :portalId AND slug = :slug`,
                { replacements: { portalId, slug: finalSlug } }
            );
            if (!collision || collision.length === 0) break;
            finalSlug = `${baseSlug}-${++suffix}`;
        }
        await sequelize.query(
            `INSERT INTO article_publications (article_id, portal_id, slug, status, visibility, commenting_enabled)
             VALUES (:articleId, :portalId, :slug, 'published', 'public', true)`,
            {
                replacements: {
                    articleId,
                    portalId,
                    slug: finalSlug,
                },
            }
        );
    }
}
