import PublicationModel from "./PublicationModel.js";
// Ensure models are initialized by importing models.js
import "../../database/models.js";

function toApiShape(p) {
    const row = p && typeof p.get === "function" ? p.get({ plain: true }) : p;
    if (!row) return null;
    return {
        id_publication: row.publication_id,
        redirectionLink: "",
        date: row.real_publication_month_date
            ? new Date(row.real_publication_month_date).toISOString().split("T")[0]
            : null,
        revista: row.publication_theme || "",
        número:
            row.magazine_this_year_issue != null ? String(row.magazine_this_year_issue) : "",
        publication_main_image_url: row.publication_main_image_url || ""
    };
}

/**
 * @param {{ portalNames?: string[] }} opts - portalNames is ignored (legacy); kept for call-site compatibility.
 */
export async function getAllPublications(opts = {}) {
    try {
        if (!PublicationModel.sequelize) {
            console.warn("PublicationModel not initialized, returning empty array");
            return [];
        }

        void opts?.portalNames;

        const publications = await PublicationModel.findAll({
            order: [
                ["real_publication_month_date", "DESC"],
                ["publication_year", "DESC"],
                ["publication_id", "DESC"]
            ]
        });

        return publications.map((p) => toApiShape(p)).filter(Boolean);
    } catch (error) {
        console.error("Error fetching publications from database:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);

        if (
            error.name === "SequelizeConnectionError" ||
            error.name === "SequelizeDatabaseError" ||
            error.name === "SequelizeConnectionRefusedError" ||
            error.message?.includes("ETIMEDOUT") ||
            error.message?.includes("ECONNREFUSED") ||
            (error.message?.includes("relation") && error.message?.includes("does not exist")) ||
            error.message?.includes("not initialized") ||
            error.message?.includes("Model not found")
        ) {
            console.warn("Database connection issue, returning empty array");
            return [];
        }
        throw error;
    }
}

export async function getPublicationById(idPublication) {
    try {
        const publication = await PublicationModel.findByPk(idPublication);
        if (!publication) {
            throw new Error(`Publication with id ${idPublication} not found`);
        }
        return toApiShape(publication);
    } catch (error) {
        console.error("Error fetching publication from database:", error);
        throw error;
    }
}

function parseMonth(v) {
    if (v == null || v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 12) return null;
    return n;
}

export async function createPublication(publicationData) {
    const requestId = `publication_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[PublicationService] [${requestId}] Starting createPublication`);

    try {
        if (!PublicationModel.sequelize) {
            console.error(`[PublicationService] [${requestId}] PublicationModel not initialized`);
            throw new Error("PublicationModel not initialized");
        }

        const dbConfig = PublicationModel.sequelize.config;
        console.log(`[PublicationService] [${requestId}] Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
        console.log(`[PublicationService] [${requestId}] Creating publication with data:`, JSON.stringify(publicationData, null, 2));

        const format =
            publicationData.publication_format === "informer" || publicationData.publication_format === "flipbook"
                ? publicationData.publication_format
                : "flipbook";

        const publication = await PublicationModel.create({
            publication_id: publicationData.id_publication,
            magazine_id: publicationData.magazine_id ?? publicationData.id_magazine ?? null,
            magazine_general_issue_number:
                publicationData.magazine_general_issue_number != null
                    ? Number(publicationData.magazine_general_issue_number)
                    : null,
            publication_year:
                publicationData.publication_year != null ? Number(publicationData.publication_year) : null,
            magazine_this_year_issue:
                publicationData.magazine_this_year_issue != null
                    ? Number(publicationData.magazine_this_year_issue)
                    : publicationData.número != null
                      ? Number(publicationData.número)
                      : null,
            publication_expected_publication_month: parseMonth(
                publicationData.publication_expected_publication_month
            ),
            real_publication_month_date:
                publicationData.real_publication_month_date ?? publicationData.date ?? null,
            publication_materials_deadline: publicationData.publication_materials_deadline ?? null,
            publication_main_image_url: publicationData.publication_main_image_url || "",
            publication_edition_name: publicationData.publication_edition_name ?? "",
            is_special_edition: Boolean(publicationData.is_special_edition),
            publication_theme:
                publicationData.publication_theme ??
                publicationData.revista ??
                publicationData.magazine ??
                "",
            publication_status: publicationData.publication_status != null ? String(publicationData.publication_status) : "draft",
            publication_format: format
        });

        console.log(`[PublicationService] [${requestId}] Publication created successfully:`, publication.toJSON());

        return toApiShape(publication);
    } catch (error) {
        console.error(`[PublicationService] [${requestId}] Error creating publication in database`);
        console.error(`[PublicationService] [${requestId}] Error name:`, error.name);
        console.error(`[PublicationService] [${requestId}] Error message:`, error.message);
        console.error(`[PublicationService] [${requestId}] Error stack:`, error.stack);

        if (
            error.name === "SequelizeConnectionError" ||
            error.name === "SequelizeDatabaseError" ||
            error.name === "SequelizeConnectionRefusedError" ||
            error.message?.includes("ETIMEDOUT") ||
            error.message?.includes("ECONNREFUSED")
        ) {
            const dbConfig = PublicationModel.sequelize?.config;
            if (dbConfig) {
                console.error(`[PublicationService] [${requestId}] Attempted connection to: ${dbConfig.host}:${dbConfig.port}`);
            }
            const errorMsg = error.message || "";
            let helpfulMsg = `Database connection error: ${errorMsg}`;
            if (errorMsg.includes("ETIMEDOUT") || errorMsg.includes("ECONNREFUSED")) {
                helpfulMsg += "\n\nPossible solutions:\n";
                helpfulMsg += "1. Check if your IP is allowed in RDS Security Group\n";
                helpfulMsg += "2. Verify DATABASE_HOST, DATABASE_PORT in .env file\n";
                helpfulMsg += "3. Ensure RDS instance is running and publicly accessible\n";
                helpfulMsg += "4. Check your network/firewall settings\n";
                helpfulMsg += "5. Consider using SSH tunnel for secure connection";
            }
            throw new Error(helpfulMsg);
        }

        throw error;
    }
}

export async function updatePublication(idPublication, publicationData) {
    try {
        const publication = await PublicationModel.findByPk(idPublication);
        if (!publication) {
            throw new Error(`Publication with id ${idPublication} not found`);
        }

        const d = publicationData;
        if (d.redirectionLink !== undefined) void d.redirectionLink;
        if (d.real_publication_month_date !== undefined || d.date !== undefined) {
            publication.real_publication_month_date = d.real_publication_month_date ?? d.date ?? publication.real_publication_month_date;
        }
        if (d.publication_theme !== undefined || d.revista !== undefined) {
            publication.publication_theme = d.publication_theme ?? d.revista ?? publication.publication_theme;
        }
        if (d.magazine_this_year_issue !== undefined || d.número !== undefined) {
            const n = d.magazine_this_year_issue ?? d.número;
            publication.magazine_this_year_issue = n != null ? Number(n) : null;
        }
        if (d.publication_main_image_url !== undefined) publication.publication_main_image_url = d.publication_main_image_url;
        if (d.magazine_id !== undefined) publication.magazine_id = d.magazine_id;
        if (d.magazine_general_issue_number !== undefined) {
            publication.magazine_general_issue_number =
                d.magazine_general_issue_number != null ? Number(d.magazine_general_issue_number) : null;
        }
        if (d.publication_year !== undefined) {
            publication.publication_year = d.publication_year != null ? Number(d.publication_year) : null;
        }
        if (d.publication_expected_publication_month !== undefined) {
            publication.publication_expected_publication_month = parseMonth(d.publication_expected_publication_month);
        }
        if (d.publication_materials_deadline !== undefined) publication.publication_materials_deadline = d.publication_materials_deadline;
        if (d.publication_edition_name !== undefined) publication.publication_edition_name = d.publication_edition_name;
        if (d.is_special_edition !== undefined) publication.is_special_edition = Boolean(d.is_special_edition);
        if (d.publication_status !== undefined) publication.publication_status = String(d.publication_status);
        if (d.publication_format !== undefined) {
            publication.publication_format =
                d.publication_format === "informer" || d.publication_format === "flipbook" ? d.publication_format : publication.publication_format;
        }

        await publication.save();

        return toApiShape(publication);
    } catch (error) {
        console.error("Error updating publication in database:", error);
        throw error;
    }
}

export async function deletePublication(idPublication) {
    try {
        const publication = await PublicationModel.findByPk(idPublication);
        if (!publication) {
            throw new Error(`Publication with id ${idPublication} not found`);
        }

        await publication.destroy();

        return toApiShape(publication);
    } catch (error) {
        console.error("Error deleting publication in database:", error);
        throw error;
    }
}
