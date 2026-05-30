/**
 * Maintain the auto-generated `index.pdf` and `summary.pdf` for each publication.
 *
 *   …/{edition}/index/index.pdf      – every advert slot row (customer · page)
 *   …/{edition}/summary/summary.pdf  – every publication article (name · first page)
 *
 * Regeneration is fire-and-forget: callers should `await` only when they want
 * to know the URL synchronously; otherwise treat the helper as best-effort and
 * log failures (see `triggerRegenerate`).
 *
 * The resulting Cloudfront URLs are persisted on `publications_db` columns
 * `publication_index_pdf_url` / `publication_summary_pdf_url`, and broadcast to
 * every slot whose `slot_content_type` is `index` / `summary` via the
 * `flatplan_index_pdf_url` / `flatplan_summary_pdf_url` enrichers used by the
 * flatplan tile thumbnails.
 */

import { Op } from "sequelize";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import {
    PublicationModel,
    PublicationSlotDbModel,
    PublicationArticleDbModel,
    CustomerDbModel,
    MediaModel,
} from "../../database/models.js";
import "../../database/models.js";
import { uploadBufferToS3 } from "../media/S3Service.js";
import { createMedia, deleteMedia } from "../media/MediaService.js";
import {
    ensurePublicationIndexFolderHierarchy,
    ensurePublicationSummaryFolderHierarchy,
    publicationIndexMediatecaPath,
    publicationSummaryMediatecaPath,
} from "./PublicationMediatecaFolderService.js";
import { buildAdvertiserIndexHtml } from "./advertiserIndexHtml.js";

/** Filenames are stable so previous PDFs are detectable and replaceable. */
const INDEX_PDF_FILENAME = "index.pdf";
const SUMMARY_PDF_FILENAME = "summary.pdf";

const ADVERT_SLOT_KEYS_INCLUDED = new Set([
    "cover",
    "inside_cover",
    "preferential_page",
    "regular_page",
    "end",
]);

/**
 * Resolve every advert row that should appear in the index (rows whose content
 * type is `advert` *and* `slot_state` is `pending` so padding placeholders are
 * skipped). Returns rows already sorted by `publication_page`.
 *
 * @returns {Promise<Array<{ slotId: number, page: number | null, slotKey: string, customerId: string | null, customerName: string }>>}
 */
export async function collectAdvertRowsForIndex(publicationId) {
    if (!PublicationSlotDbModel?.sequelize) return [];

    const rows = await PublicationSlotDbModel.findAll({
        where: { publication_id: String(publicationId) },
    });

    const advertRows = [];
    const customerIds = new Set();
    for (const row of rows) {
        const slotKey = String(row.get("slot_key") ?? "").trim().toLowerCase();
        if (!ADVERT_SLOT_KEYS_INCLUDED.has(slotKey)) continue;

        const contentType = String(row.get("slot_content_type") ?? "")
            .trim()
            .toLowerCase();
        if (contentType !== "advert") continue;

        const state = String(row.get("slot_state") ?? "").trim().toLowerCase();
        if (state === "padding") continue;

        const cid = row.get("customer_id") != null ? String(row.get("customer_id")).trim() : "";
        if (cid) customerIds.add(cid);

        const pp = Number(row.get("publication_page"));
        advertRows.push({
            slotId: Number(row.get("publication_slot_id")),
            page: Number.isFinite(pp) ? pp : null,
            slotKey,
            customerId: cid || null,
            customerName: "",
        });
    }

    if (customerIds.size > 0 && CustomerDbModel?.sequelize) {
        const customers = await CustomerDbModel.findAll({
            where: { id_customer: { [Op.in]: [...customerIds] } },
            attributes: ["id_customer", "name"],
        });
        const nameById = new Map();
        for (const c of customers) {
            const cid = String(c.get("id_customer") ?? "").trim();
            if (cid) nameById.set(cid, String(c.get("name") ?? "").trim());
        }
        for (const r of advertRows) {
            if (r.customerId && nameById.has(r.customerId)) {
                r.customerName = nameById.get(r.customerId) || "";
            }
        }
    }

    advertRows.sort((a, b) => {
        const ap = a.page == null ? Number.POSITIVE_INFINITY : a.page;
        const bp = b.page == null ? Number.POSITIVE_INFINITY : b.page;
        if (ap !== bp) return ap - bp;
        return a.slotId - b.slotId;
    });

    return advertRows;
}

/**
 * Resolve every publication_article row with the publication_page of its first
 * slot (`publication_slots_id_array[0]`). Articles without any slot or whose
 * first slot row no longer exists are skipped.
 *
 * @returns {Promise<Array<{ articleId: string, name: string, firstPage: number | null, state: string }>>}
 */
async function collectArticleRowsForSummary(publicationId) {
    if (!PublicationArticleDbModel?.sequelize) return [];

    const articles = await PublicationArticleDbModel.findAll({
        where: { publication_id: String(publicationId) },
    });
    if (articles.length === 0) return [];

    const allFirstSlotIds = new Set();
    const articleMeta = [];
    for (const ap of articles) {
        const arr = Array.isArray(ap.get("publication_slots_id_array"))
            ? ap
                  .get("publication_slots_id_array")
                  .map((n) => Number(n))
                  .filter((n) => Number.isFinite(n) && n > 0)
            : [];
        const firstSlotId = arr.length > 0 ? arr[0] : null;
        if (firstSlotId != null) allFirstSlotIds.add(firstSlotId);
        articleMeta.push({
            articleId: String(ap.get("publication_article_id") ?? ""),
            articleKey: String(ap.get("article_id") ?? ""),
            name: String(ap.get("publication_art_name") ?? "").trim(),
            firstSlotId,
            state: String(ap.get("publication_article_state") ?? "").trim() || "unfinished",
        });
    }

    /** @type {Map<number, number>} */
    const pageBySlotId = new Map();
    if (allFirstSlotIds.size > 0) {
        const slots = await PublicationSlotDbModel.findAll({
            where: { publication_slot_id: { [Op.in]: [...allFirstSlotIds] } },
            attributes: ["publication_slot_id", "publication_page"],
        });
        for (const s of slots) {
            const sid = Number(s.get("publication_slot_id"));
            const pp = Number(s.get("publication_page"));
            if (Number.isFinite(sid)) {
                pageBySlotId.set(sid, Number.isFinite(pp) ? pp : null);
            }
        }
    }

    const rows = articleMeta.map((m) => ({
        articleId: m.articleId,
        articleKey: m.articleKey,
        name: m.name || `Article ${m.articleKey.slice(0, 8)}`,
        firstPage: m.firstSlotId != null ? pageBySlotId.get(m.firstSlotId) ?? null : null,
        state: m.state,
    }));

    rows.sort((a, b) => {
        const ap = a.firstPage == null ? Number.POSITIVE_INFINITY : a.firstPage;
        const bp = b.firstPage == null ? Number.POSITIVE_INFINITY : b.firstPage;
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
    });

    return rows;
}

/** Width in PDF units (A4 portrait at 72 dpi). */
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 56;
const LINE_HEIGHT = 16;

/** Replace characters StandardFonts (WinAnsi) can't encode with a safe ASCII approximation. */
function sanitizeWinAnsi(value) {
    return String(value ?? "")
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
        .replace(/[\u2013\u2014]/g, "-")
        .replace(/\u2026/g, "...")
        .replace(/\u2022/g, "*")
        .replace(/[\u00A0]/g, " ");
}

/**
 * Render a table-like PDF where every row is `{leftLabel} … {rightLabel}` with
 * dotted leaders so the layout reads as an actual table-of-contents.
 *
 * @param {{ title: string, subtitle: string, rows: Array<{ left: string, right: string }>, emptyMessage: string }} args
 * @returns {Promise<Buffer>}
 */
async function buildTocPdf({ title, subtitle, rows, emptyMessage }) {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    const usableWidth = A4_WIDTH - MARGIN_X * 2;
    const bottomLimit = MARGIN_BOTTOM + LINE_HEIGHT;

    let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    let cursorY = A4_HEIGHT - MARGIN_TOP;

    const drawHeader = () => {
        page.drawText(sanitizeWinAnsi(title), {
            x: MARGIN_X,
            y: cursorY,
            size: 22,
            font: fontBold,
            color: rgb(0.09, 0.11, 0.18),
        });
        cursorY -= 26;
        if (subtitle) {
            page.drawText(sanitizeWinAnsi(subtitle), {
                x: MARGIN_X,
                y: cursorY,
                size: 11,
                font,
                color: rgb(0.35, 0.4, 0.5),
            });
            cursorY -= 18;
        }
        page.drawLine({
            start: { x: MARGIN_X, y: cursorY },
            end: { x: MARGIN_X + usableWidth, y: cursorY },
            thickness: 0.8,
            color: rgb(0.6, 0.62, 0.7),
        });
        cursorY -= 18;
    };

    drawHeader();

    if (rows.length === 0) {
        page.drawText(sanitizeWinAnsi(emptyMessage), {
            x: MARGIN_X,
            y: cursorY,
            size: 11,
            font,
            color: rgb(0.4, 0.45, 0.55),
        });
    } else {
        for (const row of rows) {
            if (cursorY < bottomLimit) {
                page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
                cursorY = A4_HEIGHT - MARGIN_TOP;
                drawHeader();
            }

            const leftText = sanitizeWinAnsi(row.left || "—");
            const rightText = sanitizeWinAnsi(row.right || "—");
            const rightWidth = font.widthOfTextAtSize(rightText, 11);
            const rightX = MARGIN_X + usableWidth - rightWidth;

            // Truncate the left text so it never collides with the right column.
            const maxLeftWidth = usableWidth - rightWidth - 18;
            let leftDisplay = leftText;
            while (font.widthOfTextAtSize(leftDisplay, 11) > maxLeftWidth && leftDisplay.length > 4) {
                leftDisplay = leftDisplay.slice(0, -2);
            }
            if (leftDisplay !== leftText) leftDisplay = `${leftDisplay.slice(0, -1)}…`;

            page.drawText(leftDisplay, {
                x: MARGIN_X,
                y: cursorY,
                size: 11,
                font,
                color: rgb(0.12, 0.14, 0.2),
            });

            // Dotted leader between the two columns.
            const leftWidth = font.widthOfTextAtSize(leftDisplay, 11);
            const leaderStart = MARGIN_X + leftWidth + 6;
            const leaderEnd = rightX - 6;
            if (leaderEnd > leaderStart) {
                page.drawText(".".repeat(Math.max(0, Math.floor((leaderEnd - leaderStart) / 3))), {
                    x: leaderStart,
                    y: cursorY,
                    size: 11,
                    font,
                    color: rgb(0.6, 0.62, 0.7),
                });
            }

            page.drawText(rightText, {
                x: rightX,
                y: cursorY,
                size: 11,
                font: fontBold,
                color: rgb(0.09, 0.11, 0.18),
            });

            cursorY -= LINE_HEIGHT;
        }
    }

    const bytes = await doc.save();
    return Buffer.from(bytes);
}

/**
 * Replace every existing media row in `folderId` (whatever its name) and then
 * upload `buffer` as `filename`. Keeps the folder tidy with a single PDF.
 *
 * @returns {Promise<{ cdnUrl: string, mediaId: string }>}
 */
async function replaceFolderContentsWithPdf({ folderId, folderPath, filename, buffer }) {
    if (MediaModel?.sequelize) {
        const existing = await MediaModel.findAll({ where: { folder_id: folderId } });
        for (const row of existing) {
            try {
                await deleteMedia(String(row.get("id")));
            } catch (err) {
                console.warn(
                    "[PublicationIndexSummary] failed to delete previous media",
                    row.get("id"),
                    err?.message ?? err
                );
            }
        }
    }

    const { mediaId, s3Key, cdnUrl } = await uploadBufferToS3({
        buffer,
        contentType: "application/pdf",
        filename,
    });

    await createMedia({
        mediaId,
        name: filename,
        contentName: filename,
        s3Key,
        folderId,
        folderPath,
        cdnUrl,
        contentType: "application/pdf",
        type: "pdf",
    });

    return { cdnUrl: cdnUrl || "", mediaId };
}

/**
 * Build & upload the index PDF for `publication`. Persists the resulting URL
 * on `publication_index_pdf_url`. Returns the public URL (may be empty when
 * uploads/DB are not configured).
 */
export async function regeneratePublicationIndexPdf(publication) {
    if (!publication) return "";
    const publicationId = String(publication.get("publication_id") ?? "");
    if (!publicationId) return "";

    const editionName = publication.get("publication_edition_name") ?? "";
    const folderId = await ensurePublicationIndexFolderHierarchy(publication);
    if (!folderId) return "";
    const folderPath = publicationIndexMediatecaPath(editionName);

    const rows = await collectAdvertRowsForIndex(publicationId);

    const tableRows = rows.map((r) => ({
        left: r.customerName
            ? r.customerName
            : `(${r.slotKey || "advert"} #${r.slotId})`,
        right: r.page != null ? `p. ${r.page}` : "—",
    }));

    const subtitle = `${editionName ? `${editionName} · ` : ""}${rows.length} advert${rows.length === 1 ? "" : "s"}`;

    const buffer = await buildTocPdf({
        title: "Advert index",
        subtitle,
        rows: tableRows,
        emptyMessage: "No adverts have been assigned to this publication yet.",
    });

    const { cdnUrl } = await replaceFolderContentsWithPdf({
        folderId,
        folderPath,
        filename: INDEX_PDF_FILENAME,
        buffer,
    });

    try {
        await publication.update({ publication_index_pdf_url: cdnUrl || null });
    } catch (err) {
        const msg = String(err?.message ?? "");
        if (!msg.includes("publication_index_pdf_url")) throw err;
        console.warn(
            "[PublicationIndexSummary] column publication_index_pdf_url missing; run migration 048"
        );
    }

    return cdnUrl;
}

/**
 * Build & upload the summary PDF for `publication`. Persists the resulting
 * URL on `publication_summary_pdf_url`.
 */
export async function regeneratePublicationSummaryPdf(publication) {
    if (!publication) return "";
    const publicationId = String(publication.get("publication_id") ?? "");
    if (!publicationId) return "";

    const editionName = publication.get("publication_edition_name") ?? "";
    const folderId = await ensurePublicationSummaryFolderHierarchy(publication);
    if (!folderId) return "";
    const folderPath = publicationSummaryMediatecaPath(editionName);

    const rows = await collectArticleRowsForSummary(publicationId);

    const tableRows = rows.map((r) => ({
        left: r.name,
        right: r.firstPage != null ? `p. ${r.firstPage}` : "—",
    }));

    const subtitle = `${editionName ? `${editionName} · ` : ""}${rows.length} article${rows.length === 1 ? "" : "s"}`;

    const buffer = await buildTocPdf({
        title: "Article summary",
        subtitle,
        rows: tableRows,
        emptyMessage: "No publication articles have been added yet.",
    });

    const { cdnUrl } = await replaceFolderContentsWithPdf({
        folderId,
        folderPath,
        filename: SUMMARY_PDF_FILENAME,
        buffer,
    });

    try {
        await publication.update({ publication_summary_pdf_url: cdnUrl || null });
    } catch (err) {
        const msg = String(err?.message ?? "");
        if (!msg.includes("publication_summary_pdf_url")) throw err;
        console.warn(
            "[PublicationIndexSummary] column publication_summary_pdf_url missing; run migration 048"
        );
    }

    return cdnUrl;
}

/**
 * Regenerate both PDFs for one publication. Looks up the publication row when
 * a string id is passed.
 *
 * @param {string | import("sequelize").Model} publicationOrId
 * @returns {Promise<{ index_pdf_url: string, summary_pdf_url: string } | null>}
 */
export async function regeneratePublicationIndexAndSummary(publicationOrId) {
    if (!PublicationModel?.sequelize) return null;

    let publication = publicationOrId;
    if (typeof publicationOrId === "string") {
        publication = await PublicationModel.findByPk(publicationOrId);
    }
    if (!publication) return null;

    const indexUrl = await regeneratePublicationIndexPdf(publication);
    const summaryUrl = await regeneratePublicationSummaryPdf(publication);

    return { index_pdf_url: indexUrl, summary_pdf_url: summaryUrl };
}

/**
 * Fire-and-forget regeneration helper for API route handlers. Logs failures
 * without surfacing them so user-facing endpoints remain unaffected.
 *
 * @param {string} publicationId
 */
export function triggerRegeneratePublicationIndexAndSummary(publicationId) {
    const pid = String(publicationId ?? "").trim();
    if (!pid) return;
    regeneratePublicationIndexAndSummary(pid).catch((err) => {
        console.warn(
            `[PublicationIndexSummary] regeneration failed for ${pid}:`,
            err?.message ?? err
        );
    });
}
