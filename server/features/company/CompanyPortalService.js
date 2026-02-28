import Database from "../../database/database.js";

/**
 * Get portals where a company is visible.
 * @param {string} companyId - companies.company_id
 * @returns {Promise<Array<{ portalId: number, portalName: string, slug: string, status: string }>>}
 */
export async function getPortalsByCompanyId(companyId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT cp.portal_id AS "portalId", p.name AS "portalName", cp.slug, cp.status
         FROM company_portals cp
         JOIN portals p ON p.id = cp.portal_id
         WHERE cp.company_id = :companyId
         ORDER BY p.name`,
        { replacements: { companyId } }
    );
    return (rows || []).map((r) => ({
        portalId: r.portalId,
        portalName: r.portalName,
        slug: r.slug,
        status: r.status ?? "active",
    }));
}

/**
 * Add company to a portal (creates company_portals row).
 */
export async function addCompanyToPortal(companyId, portalId, commercialName = "") {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const baseSlug =
        (commercialName || companyId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || companyId.replace(/_/g, "-");
    const [existing] = await sequelize.query(
        `SELECT 1 FROM company_portals WHERE company_id = :companyId AND portal_id = :portalId`,
        { replacements: { companyId, portalId } }
    );
    if (existing && existing.length > 0) {
        return getPortalsByCompanyId(companyId);
    }
    let finalSlug = baseSlug;
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM company_portals WHERE portal_id = :portalId AND slug = :slug`,
            { replacements: { portalId, slug: finalSlug } }
        );
        if (!collision || collision.length === 0) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO company_portals (company_id, portal_id, slug, status)
         VALUES (:companyId, :portalId, :slug, 'active')`,
        { replacements: { companyId, portalId, slug: finalSlug } }
    );
    return getPortalsByCompanyId(companyId);
}

/**
 * Remove company from a portal (deletes company_portals row).
 */
export async function removeCompanyFromPortal(companyId, portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    await sequelize.query(
        `DELETE FROM company_portals WHERE company_id = :companyId AND portal_id = :portalId`,
        { replacements: { companyId, portalId } }
    );
    return getPortalsByCompanyId(companyId);
}

/**
 * Create company_portals rows for each portalId.
 */
export async function createCompanyPortals(companyId, portalIds, commercialName = "") {
    if (!Array.isArray(portalIds) || portalIds.length === 0) return;
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    const baseSlug =
        (commercialName || companyId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || companyId.replace(/_/g, "-");
    for (const portalId of portalIds) {
        let finalSlug = baseSlug;
        let suffix = 0;
        for (;;) {
            const [collision] = await sequelize.query(
                `SELECT 1 FROM company_portals WHERE portal_id = :portalId AND slug = :slug`,
                { replacements: { portalId, slug: finalSlug } }
            );
            if (!collision || collision.length === 0) break;
            finalSlug = `${baseSlug}-${++suffix}`;
        }
        await sequelize.query(
            `INSERT INTO company_portals (company_id, portal_id, slug, status)
             VALUES (:companyId, :portalId, :slug, 'active')
             ON CONFLICT (company_id, portal_id) DO NOTHING`,
            { replacements: { companyId, portalId, slug: finalSlug } }
        );
    }
}
