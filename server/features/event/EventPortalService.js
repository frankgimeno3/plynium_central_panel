import Database from "../../database/database.js";

/**
 * Get portals where an event is published.
 * @param {string} eventId - events.id_fair
 * @returns {Promise<Array<{ portalId: number, portalName: string, slug: string, status: string }>>}
 */
export async function getPortalsByEventId(eventId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) return [];
    const sequelize = db.getSequelize();
    const [rows] = await sequelize.query(
        `SELECT ep.portal_id AS "portalId", p.name AS "portalName", ep.slug, ep.status
         FROM event_portals ep
         JOIN portals p ON p.id = ep.portal_id
         WHERE ep.event_id = :eventId
         ORDER BY p.name`,
        { replacements: { eventId } }
    );
    return (rows || []).map((r) => ({
        portalId: r.portalId,
        portalName: r.portalName,
        slug: r.slug,
        status: r.status ?? "active",
    }));
}

/**
 * Add event to a portal (creates event_portals row).
 * @param {string} eventId
 * @param {number} portalId
 * @param {string} eventName - used for slug generation
 */
export async function addEventToPortal(eventId, portalId, eventName = "") {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    const baseSlug =
        (eventName || eventId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || eventId.replace(/-/g, "-");
    const [existing] = await sequelize.query(
        `SELECT 1 FROM event_portals WHERE event_id = :eventId AND portal_id = :portalId`,
        { replacements: { eventId, portalId } }
    );
    if (existing && existing.length > 0) {
        return getPortalsByEventId(eventId);
    }
    let finalSlug = baseSlug;
    let suffix = 0;
    for (;;) {
        const [collision] = await sequelize.query(
            `SELECT 1 FROM event_portals WHERE portal_id = :portalId AND slug = :slug`,
            { replacements: { portalId, slug: finalSlug } }
        );
        if (!collision || collision.length === 0) break;
        finalSlug = `${baseSlug}-${++suffix}`;
    }
    await sequelize.query(
        `INSERT INTO event_portals (event_id, portal_id, slug, status)
         VALUES (:eventId, :portalId, :slug, 'active')`,
        { replacements: { eventId, portalId, slug: finalSlug } }
    );
    return getPortalsByEventId(eventId);
}

/**
 * Remove event from a portal (deletes event_portals row).
 */
export async function removeEventFromPortal(eventId, portalId) {
    const db = Database.getInstance();
    if (!db.isConfigured()) throw new Error("Database not configured");
    const sequelize = db.getSequelize();
    await sequelize.query(
        `DELETE FROM event_portals WHERE event_id = :eventId AND portal_id = :portalId`,
        { replacements: { eventId, portalId } }
    );
    return getPortalsByEventId(eventId);
}

/**
 * Create event_portals rows for each portalId.
 */
export async function createEventPortals(eventId, portalIds, eventName = "") {
    if (!Array.isArray(portalIds) || portalIds.length === 0) return;
    const db = Database.getInstance();
    if (!db.isConfigured()) return;
    const sequelize = db.getSequelize();
    const baseSlug =
        (eventName || eventId)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "") || eventId.replace(/-/g, "-");
    for (const portalId of portalIds) {
        let finalSlug = baseSlug;
        let suffix = 0;
        for (;;) {
            const [collision] = await sequelize.query(
                `SELECT 1 FROM event_portals WHERE portal_id = :portalId AND slug = :slug`,
                { replacements: { portalId, slug: finalSlug } }
            );
            if (!collision || collision.length === 0) break;
            finalSlug = `${baseSlug}-${++suffix}`;
        }
        await sequelize.query(
            `INSERT INTO event_portals (event_id, portal_id, slug, status)
             VALUES (:eventId, :portalId, :slug, 'active')
             ON CONFLICT (event_id, portal_id) DO NOTHING`,
            { replacements: { eventId, portalId, slug: finalSlug } }
        );
    }
}
