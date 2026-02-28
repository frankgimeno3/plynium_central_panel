import Database from "../../database/database.js";

/**
 * Get portals where a publication is visible.
 * @param {string} publicationId - publications.id_publication
 * @returns {Promise<Array<{ portalId: number, portalName: string, slug: string, redirectUrl: string, status: string }>>}
 */
export async function getPortalsByPublicationId(publicationId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT pp.portal_id AS "portalId", p.name AS "portalName", pp.slug, pp.redirect_url AS "redirectUrl", pp.status
         FROM publication_portals pp
         JOIN portals p ON p.id = pp.portal_id
         WHERE pp.publication_id = :publicationId
         ORDER BY p.name`,
        { replacements: { publicationId } }
    );
    return (rows || []).map((r) => ({
        portalId: r.portalId,
        portalName: r.portalName,
        slug: r.slug,
        redirectUrl: r.redirectUrl ?? "",
        status: r.status ?? "active",
    }));
}

/**
 * Add publication to a portal (creates publication_portals row).
 * @param {string} publicationId
 * @param {number} portalId
 * @param {string} redirectUrl - from publications.redirection_link
 * @param {string} slugBase - optional, defaults to publicationId
 */
export async function addPublicationToPortal(publicationId, portalId, redirectUrl = "", slugBase = "") {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const baseSlug =
        (slugBase || publicationId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || publicationId.replace(/_/g, "-");
    const [existing] = await sequelize.query(
        `SELECT 1 FROM publication_portals WHERE publication_id = :publicationId AND portal_id = :portalId`,
        { replacements: { publicationId, portalId } }
    );
    if (existing && existing.length > 0) {
        return getPortalsByPublicationId(publicationId);
    }
    let finalSlug = baseSlug;
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM publication_portals WHERE portal_id = :portalId AND slug = :slug`,
            { replacements: { portalId, slug: finalSlug } }
        );
        if (!collision || collision.length === 0) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO publication_portals (publication_id, portal_id, slug, redirect_url, status)
         VALUES (:publicationId, :portalId, :slug, :redirectUrl, 'active')`,
        {
            replacements: {
                publicationId,
                portalId,
                slug: finalSlug,
                redirectUrl: redirectUrl || "",
            },
        }
    );
    return getPortalsByPublicationId(publicationId);
}

/**
 * Remove publication from a portal (deletes publication_portals row).
 */
export async function removePublicationFromPortal(publicationId, portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    await sequelize.query(
        `DELETE FROM publication_portals WHERE publication_id = :publicationId AND portal_id = :portalId`,
        { replacements: { publicationId, portalId } }
    );
    return getPortalsByPublicationId(publicationId);
}

/**
 * Create publication_portals rows for each portalId.
 * @param {string} publicationId
 * @param {number[]} portalIds
 * @param {string} redirectUrl - from publications.redirection_link
 * @param {string} slugBase - optional
 */
export async function createPublicationPortals(publicationId, portalIds, redirectUrl = "", slugBase = "") {
    if (!Array.isArray(portalIds) || portalIds.length === 0) return;
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    const baseSlug =
        (slugBase || publicationId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || publicationId.replace(/_/g, "-");
    const redirect = redirectUrl || "";
    for (const portalId of portalIds) {
        let finalSlug = baseSlug;
        let suffix = 0;
        for (;;) {
            const [collision] = await sequelize.query(
                `SELECT 1 FROM publication_portals WHERE portal_id = :portalId AND slug = :slug`,
                { replacements: { portalId, slug: finalSlug } }
            );
            if (!collision || collision.length === 0) break;
            finalSlug = `${baseSlug}-${++suffix}`;
        }
        await sequelize.query(
            `INSERT INTO publication_portals (publication_id, portal_id, slug, redirect_url, status)
             VALUES (:publicationId, :portalId, :slug, :redirectUrl, 'active')
             ON CONFLICT (publication_id, portal_id) DO NOTHING`,
            {
                replacements: {
                    publicationId,
                    portalId,
                    slug: finalSlug,
                    redirectUrl: redirect,
                },
            }
        );
    }
}
