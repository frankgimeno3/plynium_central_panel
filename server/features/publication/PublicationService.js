import PublicationModel from "./PublicationModel.js";
// Ensure models are initialized by importing models.js
import "../../database/models.js";
import { QueryTypes } from "sequelize";

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

function normalizePublicationFormat(v) {
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "informer" || s === "flipbook" || s === "both") return s;
    return "flipbook";
}

/** API row for magazine admin (planned issues + publication lists). */
export function toPublicationMagazineAdminApi(p) {
    const row = p && typeof p.get === "function" ? p.get({ plain: true }) : p;
    if (!row) return null;
    return {
        id_publication: row.publication_id,
        publication_status: row.publication_status ?? "draft",
        publication_format: row.publication_format ?? "flipbook",
        magazine_id: row.magazine_id ?? "",
        publication_year: row.publication_year ?? null,
        magazine_this_year_issue: row.magazine_this_year_issue ?? null,
        magazine_general_issue_number: row.magazine_general_issue_number ?? null,
        publication_expected_publication_month: row.publication_expected_publication_month ?? null,
        publication_theme: row.publication_theme ?? "",
        is_special_edition: Boolean(row.is_special_edition),
        publication_edition_name: row.publication_edition_name ?? "",
        real_publication_month_date: row.real_publication_month_date ?? null,
    };
}

export async function listPublicationsForMagazineId(magazineId) {
    if (!PublicationModel.sequelize) return [];
    const mid = String(magazineId || "").trim();
    if (!mid) return [];
    const rows = await PublicationModel.findAll({
        where: { magazine_id: mid },
        order: [
            ["publication_year", "DESC"],
            ["magazine_this_year_issue", "ASC"],
            ["publication_id", "ASC"],
        ],
    });
    return rows.map((r) => toPublicationMagazineAdminApi(r)).filter(Boolean);
}

async function nextMagazineGeneralIssueNumber(magazineId) {
    const mid = String(magazineId || "").trim();
    if (!mid || !PublicationModel.sequelize) return 1;
    const rows = await PublicationModel.sequelize.query(
        `SELECT COALESCE(MAX(magazine_general_issue_number), 0) + 1 AS n
     FROM publications_db WHERE magazine_id = :mid`,
        { replacements: { mid }, type: QueryTypes.SELECT }
    );
    const n = Array.isArray(rows) && rows[0] ? rows[0].n : 1;
    return Number.isInteger(Number(n)) && Number(n) > 0 ? Number(n) : 1;
}

function lastDayOfMonthIso(year, month1to12) {
    const y = Number(year);
    const m = Number(month1to12);
    if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) return null;
    const d = new Date(y, m, 0);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Creates a publications_db row for a planned magazine issue (draft).
 */
export async function createMagazineIssuePublication({
    magazineId,
    magazineName,
    publication_year,
    magazine_this_year_issue,
    publication_expected_publication_month,
    is_special_edition,
    publication_theme,
    publication_format,
}) {
    if (!PublicationModel.sequelize) throw new Error("PublicationModel not initialized");
    const mid = String(magazineId || "").trim();
    const y = Number(publication_year);
    const issueInYear = Number(magazine_this_year_issue);
    if (!mid || !Number.isInteger(y) || !Number.isInteger(issueInYear) || issueInYear < 1) {
        throw new Error("Invalid magazine issue payload");
    }
    const gen = await nextMagazineGeneralIssueNumber(mid);
    const yy = String(y).slice(-2);
    const id = `publication_${yy}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const name = String(magazineName || "").trim() || "Magazine";
    const edition = `${name} ${y} - ${String(issueInYear).padStart(3, "0")}`;
    const month = parseMonth(publication_expected_publication_month);
    const realDate = month != null ? lastDayOfMonthIso(y, month) : null;
    const format = normalizePublicationFormat(publication_format);

    const row = await PublicationModel.create({
        publication_id: id,
        magazine_id: mid,
        magazine_general_issue_number: gen,
        publication_year: y,
        magazine_this_year_issue: issueInYear,
        publication_expected_publication_month: month,
        real_publication_month_date: realDate,
        publication_materials_deadline: null,
        publication_main_image_url: "",
        publication_edition_name: edition,
        is_special_edition: Boolean(is_special_edition),
        publication_theme: String(publication_theme ?? "").trim(),
        publication_status: "draft",
        publication_format: format,
    });

    return toPublicationMagazineAdminApi(row);
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

        const format = normalizePublicationFormat(publicationData.publication_format);

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
            if (publication.publication_expected_publication_month == null) {
                publication.real_publication_month_date = null;
            }
        }
        if (
            (d.publication_expected_publication_month !== undefined || d.publication_year !== undefined) &&
            d.real_publication_month_date === undefined &&
            d.date === undefined
        ) {
            const y =
                d.publication_year != null ? Number(d.publication_year) : Number(publication.publication_year);
            const m = parseMonth(
                d.publication_expected_publication_month !== undefined
                    ? d.publication_expected_publication_month
                    : publication.publication_expected_publication_month
            );
            if (Number.isInteger(y) && m != null) {
                publication.real_publication_month_date = lastDayOfMonthIso(y, m);
            }
        }
        if (d.publication_materials_deadline !== undefined) publication.publication_materials_deadline = d.publication_materials_deadline;
        if (d.publication_edition_name !== undefined) publication.publication_edition_name = d.publication_edition_name;
        if (d.is_special_edition !== undefined) publication.is_special_edition = Boolean(d.is_special_edition);
        if (d.publication_status !== undefined) publication.publication_status = String(d.publication_status);
        if (d.publication_format !== undefined) {
            publication.publication_format = normalizePublicationFormat(d.publication_format);
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
