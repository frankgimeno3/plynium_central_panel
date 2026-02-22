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
        `SELECT ap.id, ap.portal_id AS "portalId", p.name AS "portalName", ap.slug, ap.status
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
    }));
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
