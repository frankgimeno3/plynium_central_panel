import { Op } from "sequelize";
import {
    PublicationSlotDbModel,
    PublicationArticleDbModel,
    ArticleModel,
} from "../../database/models.js";
import "../../database/models.js";

const ARTICLE_SLOT_KEYS_INCLUDED = new Set([
    "cover",
    "inside_cover",
    "preferential_page",
    "regular_page",
    "end",
]);

function compareByPage(a, b) {
    const ap = a.page == null ? Number.POSITIVE_INFINITY : a.page;
    const bp = b.page == null ? Number.POSITIVE_INFINITY : b.page;
    if (ap !== bp) return ap - bp;
    return a.slotId - b.slotId;
}

function pickGroupedTitle(slots) {
    for (const row of slots) {
        const title = String(row.articleTitle ?? "").trim();
        if (title) return title;
    }
    const primary = slots[0];
    if (!primary) return "";
    if (primary.articleTitle) return String(primary.articleTitle).trim();
    return `(${primary.slotKey} #${primary.slotId})`;
}

/**
 * Merge per-slot rows into one entry per publication article spread.
 *
 * @param {Array<{ slotId: number, page: number | null, slotKey: string, articleId: string | null, articleTitle: string, publicationArticleId?: string | null }>} perSlotRows
 */
function groupArticleRowsForSummary(perSlotRows) {
    const usedSlotIds = new Set();
    const grouped = [];

    const byPublicationArticleId = new Map();
    for (const row of perSlotRows) {
        const paId = String(row.publicationArticleId ?? "").trim();
        if (!paId) continue;
        const list = byPublicationArticleId.get(paId) ?? [];
        list.push(row);
        byPublicationArticleId.set(paId, list);
    }

    for (const [paId, list] of byPublicationArticleId) {
        const sorted = [...list].sort(compareByPage);
        for (const r of sorted) usedSlotIds.add(r.slotId);
        const primary = sorted[0];
        grouped.push({
            summaryEntryId: `pa:${paId}`,
            slotId: primary.slotId,
            slotIds: sorted.map((r) => r.slotId),
            pages: sorted.map((r) => ({
                slotId: r.slotId,
                page: r.page,
                slotKey: r.slotKey,
            })),
            page: primary.page,
            slotKey: primary.slotKey,
            articleId: primary.articleId,
            publicationArticleId: paId,
            articleTitle: pickGroupedTitle(sorted),
        });
    }

    const remainingAfterPa = perSlotRows.filter((r) => !usedSlotIds.has(r.slotId));
    const byPortalArticleId = new Map();
    for (const row of remainingAfterPa) {
        const aid = String(row.articleId ?? "").trim();
        if (!aid) continue;
        const list = byPortalArticleId.get(aid) ?? [];
        list.push(row);
        byPortalArticleId.set(aid, list);
    }

    for (const [aid, list] of byPortalArticleId) {
        if (list.length < 2) continue;
        const sorted = [...list].sort(compareByPage);
        for (const r of sorted) usedSlotIds.add(r.slotId);
        const primary = sorted[0];
        grouped.push({
            summaryEntryId: `aid:${aid}`,
            slotId: primary.slotId,
            slotIds: sorted.map((r) => r.slotId),
            pages: sorted.map((r) => ({
                slotId: r.slotId,
                page: r.page,
                slotKey: r.slotKey,
            })),
            page: primary.page,
            slotKey: primary.slotKey,
            articleId: aid,
            publicationArticleId: null,
            articleTitle: pickGroupedTitle(sorted),
        });
    }

    for (const row of perSlotRows) {
        if (usedSlotIds.has(row.slotId)) continue;
        grouped.push({
            summaryEntryId: `slot:${row.slotId}`,
            slotId: row.slotId,
            slotIds: [row.slotId],
            pages: [{ slotId: row.slotId, page: row.page, slotKey: row.slotKey }],
            page: row.page,
            slotKey: row.slotKey,
            articleId: row.articleId,
            publicationArticleId: row.publicationArticleId ?? null,
            articleTitle: pickGroupedTitle([row]),
        });
    }

    grouped.sort(compareByPage);
    return grouped;
}

/**
 * Every `article` slot in the flatplan, grouped by publication article when multi-page.
 *
 * @returns {Promise<Array<{ summaryEntryId: string, slotId: number, slotIds: number[], pages: Array<{ slotId: number, page: number | null, slotKey: string }>, page: number | null, slotKey: string, articleId: string | null, publicationArticleId: string | null, articleTitle: string }>>}
 */
export async function collectArticleSlotsForSummary(publicationId) {
    if (!PublicationSlotDbModel?.sequelize) return [];

    const pid = String(publicationId ?? "").trim();
    const rows = await PublicationSlotDbModel.findAll({
        where: { publication_id: pid },
    });

    const articles = await PublicationArticleDbModel.findAll({
        where: { publication_id: pid },
        attributes: [
            "publication_article_id",
            "article_id",
            "publication_slots_id_array",
            "publication_art_name",
        ],
    });

    /** slot id → portal article id */
    const articleIdBySlotId = new Map();
    /** slot id → publication_article_id */
    const publicationArticleIdBySlotId = new Map();
    /** publication_article_id → publication_art_name */
    const artNameByPublicationArticleId = new Map();

    for (const ap of articles) {
        const paId =
            ap.get("publication_article_id") != null
                ? String(ap.get("publication_article_id")).trim()
                : "";
        const aid = ap.get("article_id") != null ? String(ap.get("article_id")).trim() : "";
        const artName =
            ap.get("publication_art_name") != null
                ? String(ap.get("publication_art_name")).trim()
                : "";
        if (paId && artName) artNameByPublicationArticleId.set(paId, artName);

        const arr = Array.isArray(ap.get("publication_slots_id_array"))
            ? ap.get("publication_slots_id_array")
            : [];
        for (const sid of arr) {
            const n = Number(sid);
            if (!Number.isInteger(n) || n <= 0) continue;
            if (paId && !publicationArticleIdBySlotId.has(n)) {
                publicationArticleIdBySlotId.set(n, paId);
            }
            if (aid && !articleIdBySlotId.has(n)) {
                articleIdBySlotId.set(n, aid);
            }
        }
    }

    const perSlotRows = [];
    const articleIds = new Set();

    for (const row of rows) {
        const slotKey = String(row.get("slot_key") ?? "").trim().toLowerCase();
        if (!ARTICLE_SLOT_KEYS_INCLUDED.has(slotKey)) continue;

        const contentType = String(row.get("slot_content_type") ?? "")
            .trim()
            .toLowerCase();
        if (contentType !== "article") continue;

        const state = String(row.get("slot_state") ?? "").trim().toLowerCase();
        if (state === "padding") continue;

        const sid = Number(row.get("publication_slot_id"));
        const fromSlot = row.get("slot_article_id") != null ? String(row.get("slot_article_id")).trim() : "";
        const fromPa = articleIdBySlotId.get(sid) ?? "";
        const articleId = fromSlot || fromPa || null;
        if (articleId) articleIds.add(articleId);

        const publicationArticleId = publicationArticleIdBySlotId.get(sid) ?? null;
        const pp = Number(row.get("publication_page"));

        perSlotRows.push({
            slotId: sid,
            page: Number.isFinite(pp) ? pp : null,
            slotKey,
            articleId,
            publicationArticleId,
            articleTitle: "",
        });
    }

    if (articleIds.size > 0 && ArticleModel?.sequelize) {
        const portalArticles = await ArticleModel.findAll({
            where: { id_article: { [Op.in]: [...articleIds] } },
            attributes: ["id_article", "article_title"],
        });
        const titleById = new Map();
        for (const a of portalArticles) {
            const id = String(a.get("id_article") ?? "").trim();
            if (id) titleById.set(id, String(a.get("article_title") ?? "").trim());
        }
        for (const r of perSlotRows) {
            const paName = r.publicationArticleId
                ? artNameByPublicationArticleId.get(r.publicationArticleId) ?? ""
                : "";
            if (paName) {
                r.articleTitle = paName;
                continue;
            }
            if (r.articleId && titleById.has(r.articleId)) {
                r.articleTitle = titleById.get(r.articleId) || "";
            }
        }
    } else {
        for (const r of perSlotRows) {
            const paName = r.publicationArticleId
                ? artNameByPublicationArticleId.get(r.publicationArticleId) ?? ""
                : "";
            if (paName) r.articleTitle = paName;
        }
    }

    perSlotRows.sort(compareByPage);
    return groupArticleRowsForSummary(perSlotRows);
}
