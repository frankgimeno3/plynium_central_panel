/**
 * Portal visibility is no longer stored on publications_db (legacy portal / redirection_link removed).
 * @param {string} publicationId - publications_db.publication_id
 * @returns {Promise<Array<{ portalId: number, portalName: string, slug: string, redirectUrl: string, status: string }>>}
 */
export async function getPortalsByPublicationId(publicationId) {
    void publicationId;
    return [];
}

/** No-op: portal column removed from publications_db. */
export async function addPublicationToPortal(publicationId, portalId, redirectUrl = "", slugBase = "") {
    void portalId;
    void redirectUrl;
    void slugBase;
    return getPortalsByPublicationId(publicationId);
}

/** No-op: portal column removed from publications_db. */
export async function removePublicationFromPortal(publicationId, portalId) {
    void portalId;
    return getPortalsByPublicationId(publicationId);
}

/** No-op: portal column removed from publications_db. */
export async function createPublicationPortals(publicationId, portalIds, redirectUrl = "", slugBase = "") {
    void publicationId;
    void portalIds;
    void redirectUrl;
    void slugBase;
}
