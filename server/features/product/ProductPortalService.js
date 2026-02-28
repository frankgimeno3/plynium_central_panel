import Database from "../../database/database.js";

/**
 * Get portals where a product is visible.
 * @param {string} productId - products.product_id
 * @returns {Promise<Array<{ portalId: number, portalName: string, slug: string, status: string }>>}
 */
export async function getPortalsByProductId(productId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT pp.portal_id AS "portalId", p.name AS "portalName", pp.slug, pp.status
         FROM product_portals pp
         JOIN portals p ON p.id = pp.portal_id
         WHERE pp.product_id = :productId
         ORDER BY p.name`,
        { replacements: { productId } }
    );
    return (rows || []).map((r) => ({
        portalId: r.portalId,
        portalName: r.portalName,
        slug: r.slug,
        status: r.status ?? "active",
    }));
}

/**
 * Add product to a portal (creates product_portals row).
 * Caller should ensure portalId is in the company's portals when product has a company.
 */
export async function addProductToPortal(productId, portalId, productName = "") {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const baseSlug =
        (productName || productId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || productId.replace(/_/g, "-");
    const [existing] = await sequelize.query(
        `SELECT 1 FROM product_portals WHERE product_id = :productId AND portal_id = :portalId`,
        { replacements: { productId, portalId } }
    );
    if (existing && existing.length > 0) {
        return getPortalsByProductId(productId);
    }
    let finalSlug = baseSlug;
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM product_portals WHERE portal_id = :portalId AND slug = :slug`,
            { replacements: { portalId, slug: finalSlug } }
        );
        if (!collision || collision.length === 0) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO product_portals (product_id, portal_id, slug, status)
         VALUES (:productId, :portalId, :slug, 'active')`,
        { replacements: { productId, portalId, slug: finalSlug } }
    );
    return getPortalsByProductId(productId);
}

/**
 * Remove product from a portal (deletes product_portals row).
 */
export async function removeProductFromPortal(productId, portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    await sequelize.query(
        `DELETE FROM product_portals WHERE product_id = :productId AND portal_id = :portalId`,
        { replacements: { productId, portalId } }
    );
    return getPortalsByProductId(productId);
}

/**
 * Create product_portals rows for each portalId.
 * portalIds should be a subset of the company's portals when product has a company.
 */
export async function createProductPortals(productId, portalIds, productName = "") {
    if (!Array.isArray(portalIds) || portalIds.length === 0) return;
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    const baseSlug =
        (productName || productId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || productId.replace(/_/g, "-");
    for (const portalId of portalIds) {
        let finalSlug = baseSlug;
        let suffix = 0;
        for (;;) {
            const [collision] = await sequelize.query(
                `SELECT 1 FROM product_portals WHERE portal_id = :portalId AND slug = :slug`,
                { replacements: { portalId, slug: finalSlug } }
            );
            if (!collision || collision.length === 0) break;
            finalSlug = `${baseSlug}-${++suffix}`;
        }
        await sequelize.query(
            `INSERT INTO product_portals (product_id, portal_id, slug, status)
             VALUES (:productId, :portalId, :slug, 'active')
             ON CONFLICT (product_id, portal_id) DO NOTHING`,
            { replacements: { productId, portalId, slug: finalSlug } }
        );
    }
}
