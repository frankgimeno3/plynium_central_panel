import Database from "../../database/database.js";

/**
 * Get portals (with publication id) where an article is published.
 * @param {string} articleId - articles_db.id_article
 * @returns {Promise<Array<{ id: string, portalId: number, portalName: string, slug: string, status: string, visibility: string, commentingEnabled: boolean }>>}
 */
export async function getPublicationsByArticleId(articleId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT ap.article_portals_id AS id, ap.article_portal_ref_id AS "portalId", p.portal_name AS "portalName", ap.article_slug AS slug, ap.article_status AS status, ap.article_highlight_position AS "highlightPosition",
                ap.article_visibility AS "visibility", ap.article_commenting_enabled AS "commentingEnabled"
         FROM article_portals ap
         JOIN portals_id p ON p.portal_id = ap.article_portal_ref_id
         WHERE ap.article_id = :articleId
         ORDER BY p.portal_name`,
        { replacements: { articleId } }
    );
    return (rows || []).map((r) => ({
        id: r.id,
        portalId: r.portalId,
        portalName: r.portalName,
        slug: r.slug,
        status: r.status,
        highlightPosition: r.highlightPosition ?? "",
        visibility: r.visibility != null && String(r.visibility).trim() !== "" ? String(r.visibility) : "public",
        commentingEnabled: r.commentingEnabled === true,
    }));
}

/**
 * Update visibility and/or commenting for one article_portals row.
 * @param {string} articleId
 * @param {number} portalId - article_portal_ref_id (portals.id)
 * @param {{ visibility?: string, commentingEnabled?: boolean }} patch
 */
export async function updateArticlePortalPublication(articleId, portalId, patch) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const { visibility, commentingEnabled } = patch || {};
    const sets = [];
    const replacements = { articleId, portalId };
    if (visibility !== undefined) {
        sets.push("article_visibility = :visibility");
        replacements.visibility = String(visibility);
    }
    if (commentingEnabled !== undefined) {
        sets.push("article_commenting_enabled = :commentingEnabled");
        replacements.commentingEnabled = commentingEnabled === true;
    }
    if (sets.length === 0) {
        return getPublicationsByArticleId(articleId);
    }
    const sequelize = db.getSequelize();
    await sequelize.query(
        `UPDATE article_portals SET ${sets.join(", ")} WHERE article_id = :articleId AND article_portal_ref_id = :portalId`,
        { replacements }
    );
    return getPublicationsByArticleId(articleId);
}

/**
 * Get effective article_highlight_position for an article (for display when single publication).
 * @param {string} articleId
 * @returns {Promise<string>}
 */
export async function getEffectiveHighlightPosition(articleId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return "";
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT article_highlight_position FROM article_portals WHERE article_id = :articleId AND (article_highlight_position IS NOT NULL AND article_highlight_position != '') LIMIT 1`,
        { replacements: { articleId } }
    );
    return String(rows?.[0]?.article_highlight_position ?? "").trim();
}

/**
 * Add article to a portal (creates article_portals row).
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
        `SELECT 1 FROM article_portals WHERE article_id = :articleId AND article_portal_ref_id = :portalId`,
        { replacements: { articleId, portalId } }
    );
    if (existing && existing.length > 0) {
        return getPublicationsByArticleId(articleId);
    }
    let finalSlug = baseSlug;
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM article_portals WHERE article_portal_ref_id = :portalId AND article_slug = :slug`,
            { replacements: { portalId, slug: finalSlug } }
        );
        if (!collision || collision.length === 0) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO article_portals (article_id, article_portal_ref_id, article_slug, article_status, article_visibility, article_commenting_enabled)
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
 * Remove article from a portal (deletes article_portals row).
 */
export async function removeArticleFromPortal(articleId, portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    await sequelize.query(
        `DELETE FROM article_portals WHERE article_id = :articleId AND article_portal_ref_id = :portalId`,
        { replacements: { articleId, portalId } }
    );
    return getPublicationsByArticleId(articleId);
}

/**
 * Set article_highlight_position for an article in a specific portal.
 */
export async function setHighlightPositionInPortal(articleId, portalId, highlightPosition) {
    const pos = (highlightPosition || "").trim();
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    if (pos) {
        await sequelize.query(
            `UPDATE article_portals SET article_highlight_position = ''
             WHERE article_portal_ref_id = :portalId AND article_highlight_position = :pos`,
            { replacements: { portalId, pos } }
        );
    }
    await sequelize.query(
        `UPDATE article_portals SET article_highlight_position = :pos
         WHERE article_id = :articleId AND article_portal_ref_id = :portalId`,
        { replacements: { articleId, portalId, pos } }
    );
}

/**
 * Get highlighted articles for a portal.
 */
export async function getHighlightedArticlesByPortal(portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT ap.article_highlight_position AS "highlightPosition", a.id_article AS "articleId", a.article_title AS "articleTitle", a.article_main_image_url
         FROM article_portals ap
         JOIN articles_db a ON a.id_article = ap.article_id
         WHERE ap.article_portal_ref_id = :portalId AND ap.article_highlight_position IS NOT NULL AND TRIM(ap.article_highlight_position) != ''
         ORDER BY ap.article_highlight_position`,
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

export function getHighlightPositions() {
    return [...HIGHLIGHT_POSITIONS];
}

/**
 * Set the highlighted article for a position in a portal.
 */
export async function setHighlightedArticleForPosition(portalId, highlightPosition, articleId) {
    const pos = (highlightPosition || "").trim();
    const aid = (articleId || "").trim();
    if (!pos || !aid) throw new Error("highlightPosition and articleId are required");
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const [existing] = await sequelize.query(
        `SELECT 1 FROM article_portals WHERE article_id = :articleId AND article_portal_ref_id = :portalId`,
        { replacements: { articleId: aid, portalId } }
    );
    if (!existing || existing.length === 0) {
        const [articleRow] = await sequelize.query(
            `SELECT article_title FROM articles_db WHERE id_article = :articleId`,
            { replacements: { articleId: aid } }
        );
        const articleTitle = articleRow?.[0]?.article_title ?? "";
        await addArticleToPortal(aid, portalId, articleTitle);
    }
    await setHighlightPositionInPortal(aid, portalId, pos);
}

/**
 * Create article_portals rows for each portalId.
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
                `SELECT 1 FROM article_portals WHERE article_portal_ref_id = :portalId AND article_slug = :slug`,
                { replacements: { portalId, slug: finalSlug } }
            );
            if (!collision || collision.length === 0) break;
            finalSlug = `${baseSlug}-${++suffix}`;
        }
        await sequelize.query(
            `INSERT INTO article_portals (article_id, article_portal_ref_id, article_slug, article_status, article_visibility, article_commenting_enabled)
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
