import "../../database/models.js";

/** @deprecated planned_publications table removed; returns []. */
export async function getAllPlannedPublications() {
    return [];
}

/** @deprecated planned_publications table removed; always throws. */
export async function getPlannedPublicationById(id) {
    void id;
    throw new Error("Planned publications are no longer stored in the database.");
}

/** Flatplans table removed; no in-production rows from DB. */
export async function getAllFlatplans() {
    return [];
}

export async function getFlatplanById(id) {
    void id;
    throw new Error("Flatplans are no longer stored in the database.");
}

export async function createFlatplan() {
    const err = new Error("Flatplans are no longer stored in the database.");
    err.statusCode = 410;
    throw err;
}

/** Unified list without flatplan-backed "in production" items. */
export async function getAllPublicationsUnified() {
    return [];
}
