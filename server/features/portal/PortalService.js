import Database from "../../database/database.js";

function toApiPortal(row) {
    if (!row) return null;
    return {
        id: row.id,
        key: row.key,
        name: row.name,
        domain: row.domain ?? "",
        defaultLocale: row.default_locale ?? "es",
        theme: row.theme ?? "",
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    };
}

export async function getAllPortals() {
    try {
        const db = Database.getInstance();
        if (!db.isConfigured()) {
            console.warn("PortalService: database not configured, returning empty array");
            return [];
        }
        const sequelize = db.getSequelize();
        const [rows] = await sequelize.query(
            "SELECT id, key, name, domain, default_locale, theme, created_at FROM portals ORDER BY id ASC"
        );
        const list = Array.isArray(rows) ? rows : [];
        return list.map(toApiPortal);
    } catch (error) {
        console.error("Error fetching portals from database:", error);
        if (
            error.name === "SequelizeConnectionError" ||
            error.name === "SequelizeConnectionRefusedError" ||
            error.message?.includes("ETIMEDOUT") ||
            error.message?.includes("ECONNREFUSED") ||
            (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
            error.message?.includes("not initialized")
        ) {
            console.warn("Database connection issue, returning empty array");
            return [];
        }
        throw error;
    }
}
