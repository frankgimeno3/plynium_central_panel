import { Op, QueryTypes } from "sequelize";
import PublicationArticleDbModel from "./PublicationArticleDbModel.js";
import PublicationArticleChunkDbModel from "./PublicationArticleChunkDbModel.js";
import PublicationSlotDbModel from "./PublicationSlotDbModel.js";
import PublicationModel from "../publication/PublicationModel.js";
import {
    deletePublicationSlotMediatecaFolder,
    ensureArticleScreenshotsFolderHierarchy,
    ensureArticleSlotMaterialsFolderHierarchy,
} from "../publication/PublicationMediatecaFolderService.js";
import {
    deleteArticlePageScreenshot,
    pruneArticleScreenshotsBeyondPageCount,
} from "../publication/ArticleScreenshotService.js";
import { computeNextRegularPublicationPage } from "../publication/computeNextRegularPublicationPage.js";
import { shiftPublicationSlotsForRegularInsert } from "../publication/shiftPublicationSlotsForRegularInsert.js";
import "../../database/models.js";
import { randomUUID } from "node:crypto";
import {
    normalizePublicationArticleState,
    PUBLICATION_ARTICLE_STATE_VALUES,
} from "./publicationArticleState.js";
import {
    DEFAULT_MAGAZINE_PAGE_LAYOUT,
    normalizeMagazinePageLayout,
} from "./magazinePageLayout.js";
import { portalArticleContentToHtml } from "../../../lib/publication_workflow/portalArticleChunkHtml.ts";
import MediaModel from "../media/MediaModel.js";
import { deleteMedia } from "../media/MediaService.js";
import {
    areaCodeToCell,
    hasCompletePerCellBodyGrid,
    normalizeChunkAreaArray,
    perCellBodyGridAreaCodes,
    gridCellOverflowOrder,
} from "./chunkAreaCodes.js";
import {
    clearTextChunksForImageAreas,
    collapseTextChunksAfterImageRemoval,
} from "./chunkAreaDisplacement.js";

/**
 * Extract every `<img src="…">` URL embedded in chunk HTML.
 * Used by `deleteChunk` to cascade-delete mediateca records that were
 * referenced solely by the chunk being removed (best-effort).
 */
function extractAllImgSrcs(html) {
    const out = [];
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    let m;
    while ((m = regex.exec(String(html ?? "")))) {
        const url = m[1] ? m[1].trim() : "";
        if (url) out.push(url);
    }
    return out;
}

/**
 * Try to delete every mediateca media row whose `content_src` matches a URL
 * embedded in `chunkHtml`. Returns the ids of the rows that were deleted.
 * All failures are swallowed and logged so chunk deletion isn't blocked.
 */
async function tryDeleteChunkMediaByHtml(chunkHtml) {
    const urls = extractAllImgSrcs(chunkHtml);
    if (urls.length === 0) return [];
    const deletedIds = [];
    for (const url of urls) {
        try {
            if (!MediaModel.sequelize) continue;
            const row = await MediaModel.findOne({ where: { content_src: url } });
            if (!row) continue;
            const mediaId = String(row.id);
            await deleteMedia(mediaId);
            deletedIds.push(mediaId);
        } catch (error) {
            console.warn(
                "[PublicationArticleService.deleteChunk] Failed to delete media for url",
                url,
                error?.message ?? error
            );
        }
    }
    return deletedIds;
}

/** Slot key used for the auto-generated magazine pages of an article. */
export const ARTICLE_PAGE_SLOT_KEY = "regular_page";
export const ARTICLE_PAGE_SLOT_STATE = "pending";
export const ARTICLE_PAGE_DEFAULT_FORMAT = "flipbook";

/** True when `publicationSlotId` is the first slot in the article's `publication_slots_id_array` (page 1). */
export function isFirstSlotInPublicationArticleSlotsArray(publicationSlotsIdArray, publicationSlotId) {
    const sid = Number(publicationSlotId);
    if (!Number.isInteger(sid) || sid <= 0) return false;
    if (!Array.isArray(publicationSlotsIdArray) || publicationSlotsIdArray.length === 0) return false;
    const first = Number(publicationSlotsIdArray[0]);
    return Number.isFinite(first) && first === sid;
}

/**
 * When a slot is linked to an existing `publication_articles` row (same portal `article_id`)
 * but is missing from `publication_slots_id_array`, add it in flatplan page order — unless
 * another spread slot already occupies the same `publication_page`.
 *
 * @returns {Promise<{ status: "already" | "appended" | "page_conflict" | "skipped"; other_slot_id?: number }>}
 */
export async function ensureSlotInPublicationArticleSpread(
    publicationArticleId,
    publicationSlotId,
    options = {}
) {
    const paId = String(publicationArticleId ?? "").trim();
    const sid = Number(publicationSlotId);
    if (!paId || !Number.isInteger(sid) || sid <= 0) {
        return { status: "skipped" };
    }

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    const run = async (transaction) => {
        const article = await PublicationArticleDbModel.findByPk(paId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!article) return { status: "skipped" };

        const ap = article.get({ plain: true });
        const current = Array.isArray(ap.publication_slots_id_array)
            ? ap.publication_slots_id_array
                  .map((n) => Number(n))
                  .filter((n) => Number.isFinite(n) && n > 0)
            : [];
        if (current.some((id) => Number(id) === sid)) {
            return { status: "already" };
        }

        const slot = await PublicationSlotDbModel.findByPk(sid, { transaction });
        if (!slot) return { status: "skipped" };

        const slotPageRaw = slot.get("publication_page");
        const slotPage =
            slotPageRaw != null && Number.isFinite(Number(slotPageRaw))
                ? Math.round(Number(slotPageRaw))
                : null;

        const spreadSlots = current.length
            ? await PublicationSlotDbModel.findAll({
                  where: { publication_slot_id: { [Op.in]: current } },
                  attributes: ["publication_slot_id", "publication_page"],
                  transaction,
              })
            : [];

        if (slotPage != null) {
            for (const row of spreadSlots) {
                const otherId = Number(row.get("publication_slot_id"));
                const otherPage = row.get("publication_page");
                const otherPageNum =
                    otherPage != null && Number.isFinite(Number(otherPage))
                        ? Math.round(Number(otherPage))
                        : null;
                if (otherPageNum === slotPage && otherId !== sid) {
                    return { status: "page_conflict", other_slot_id: otherId };
                }
            }
        }

        const entries = [
            ...spreadSlots.map((row) => ({
                id: Number(row.get("publication_slot_id")),
                page:
                    row.get("publication_page") != null &&
                    Number.isFinite(Number(row.get("publication_page")))
                        ? Math.round(Number(row.get("publication_page")))
                        : Number.MAX_SAFE_INTEGER,
            })),
            {
                id: sid,
                page: slotPage ?? Number.MAX_SAFE_INTEGER,
            },
        ];
        entries.sort((a, b) => a.page - b.page || a.id - b.id);
        const nextArray = entries.map((e) => e.id);
        const nextCount = Math.max(Number(ap.desired_page_count) || 1, nextArray.length);

        await article.update(
            {
                publication_slots_id_array: nextArray,
                desired_page_count: nextCount,
            },
            { transaction }
        );

        await coerceRegularPageSlotToArticleForPublicationArticle(
            String(ap.publication_id),
            paId,
            sid,
            transaction
        );

        return { status: "appended" };
    };

    if (options.transaction) {
        return run(options.transaction);
    }
    return sequelize.transaction((transaction) => run(transaction));
}

/** Synthetic `article_id` prefix for magazine articles created without a portal source row. */
export const STANDALONE_PUBLICATION_ARTICLE_PREFIX = "local_standalone:";

/**
 * Allowed `publication_article_chunks.publication_article_chunk_format` values,
 * mirrored from the SQL CHECK constraint in migration 035.
 */
export const PUBLICATION_ARTICLE_CHUNK_FORMATS = [
    "title",
    "subtitle",
    "only_text",
    "only_image",
    "text_image",
    "image_text",
];

/** Magazine page chunks that must always exist once per `publication_slot_id`. */
const LOCKED_MAGAZINE_CHUNK_FORMATS = new Set(["title", "subtitle"]);

/**
 * Returns true when the underlying error indicates that one of the
 * Contents-Manager-related tables does not exist yet (migrations 034/035
 * pending). Lets callers respond with empty datasets instead of crashing.
 */
export function isMissingContentsManagerTable(error) {
    if (!error) return false;
    const msg = String(error?.message ?? "");
    if (error.name !== "SequelizeDatabaseError") return false;
    return (
        msg.includes("publication_articles") ||
        msg.includes("publication_article_chunks")
    );
}

function httpError(status, message) {
    const e = new Error(message);
    e.statusCode = status;
    return e;
}

function plain(row) {
    return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiPublicationArticle(row) {
    const p = plain(row);
    if (!p) return null;
    return {
        publication_article_id: p.publication_article_id,
        publication_id: p.publication_id,
        article_id: p.article_id,
        publication_slots_id_array: Array.isArray(p.publication_slots_id_array)
            ? p.publication_slots_id_array.map((n) => Number(n)).filter((n) => Number.isFinite(n))
            : [],
        desired_page_count:
            p.desired_page_count != null ? Number(p.desired_page_count) : 1,
        publication_article_state: normalizePublicationArticleState(
            p.publication_article_state
        ),
        publication_art_name:
            p.publication_art_name != null && String(p.publication_art_name).trim() !== ""
                ? String(p.publication_art_name).trim()
                : null,
        has_article_box:
            p.has_article_box === true ? true : p.has_article_box === false ? false : null,
        box_company_name:
            p.box_company_name != null && String(p.box_company_name).trim() !== ""
                ? String(p.box_company_name).trim()
                : null,
        box_company_direction:
            p.box_company_direction != null && String(p.box_company_direction).trim() !== ""
                ? String(p.box_company_direction).trim()
                : null,
        box_company_city:
            p.box_company_city != null && String(p.box_company_city).trim() !== ""
                ? String(p.box_company_city).trim()
                : null,
        box_company_email:
            p.box_company_email != null && String(p.box_company_email).trim() !== ""
                ? String(p.box_company_email).trim()
                : null,
        box_company_phone:
            p.box_company_phone != null && String(p.box_company_phone).trim() !== ""
                ? String(p.box_company_phone).trim()
                : null,
        box_company_web:
            p.box_company_web != null && String(p.box_company_web).trim() !== ""
                ? String(p.box_company_web).trim()
                : null,
        publication_article_created_at: p.publication_article_created_at ?? null,
        publication_article_updated_at: p.publication_article_updated_at ?? null,
    };
}

function coercePlainTextChunkHtmlForApi(html, format) {
    const fmt = String(format ?? "").toLowerCase();
    const raw = String(html ?? "");
    if (!raw.trim() || fmt !== "only_text") return raw;
    if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
    const esc = (s) =>
        String(s ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    return raw
        .split(/\r?\n/)
        .map((line) => {
            const t = line.replace(/\u00a0/g, " ");
            if (!t.trim()) return '<p style="text-align: justify">&nbsp;</p>';
            return `<p style="text-align: justify">${esc(t)}</p>`;
        })
        .join("");
}

function toApiChunk(row) {
    const p = plain(row);
    if (!p) return null;
    const format =
        p.publication_article_chunk_format != null
            ? String(p.publication_article_chunk_format)
            : "only_text";
    const chunkHtml = coercePlainTextChunkHtmlForApi(
        p.chunk_html != null ? String(p.chunk_html) : "",
        format
    );
    return {
        publication_article_chunk_id: p.publication_article_chunk_id,
        publication_article_id: p.publication_article_id,
        publication_id: p.publication_id,
        publication_slot_id:
            p.publication_slot_id != null ? Number(p.publication_slot_id) : null,
        publication_article_chunk_format: format,
        chunk_html: chunkHtml,
        chunk_position: p.chunk_position != null ? Number(p.chunk_position) : 0,
        original_article_content_id:
            p.original_article_content_id != null
                ? String(p.original_article_content_id)
                : null,
        chunk_area_array: normalizeChunkAreaArray(p.chunk_area_array),
        chunk_image_caption: chunkFormatIncludesImage(p.publication_article_chunk_format)
            ? p.chunk_image_caption != null
                ? String(p.chunk_image_caption)
                : ""
            : "",
        publication_article_chunk_created_at:
            p.publication_article_chunk_created_at ?? null,
        publication_article_chunk_updated_at:
            p.publication_article_chunk_updated_at ?? null,
    };
}

function chunkFormatIncludesImage(format) {
    const f = String(format ?? "").toLowerCase();
    return f === "only_image" || f === "text_image" || f === "image_text";
}

function primaryGridAreaCode(areaArray) {
    const areas = normalizeChunkAreaArray(areaArray);
    const code = areas[0] != null ? String(areas[0]).trim().toLowerCase() : "";
    return code || null;
}

async function findOnlyTextChunkInGridArea(
    publicationArticleId,
    slotId,
    areaCode,
    excludeChunkId = null
) {
    const rows = await PublicationArticleChunkDbModel.findAll({
        where: {
            publication_article_id: String(publicationArticleId),
            publication_slot_id: Number(slotId),
            publication_article_chunk_format: "only_text",
        },
    });
    const want = String(areaCode).trim().toLowerCase();
    for (const row of rows) {
        const cid = String(row.get("publication_article_chunk_id") ?? "");
        if (excludeChunkId && cid === String(excludeChunkId)) continue;
        if (primaryGridAreaCode(row.get("chunk_area_array")) === want) return row;
    }
    return null;
}

function chunkFormatSaveRank(format) {
    const f = String(format ?? "").trim().toLowerCase();
    if (f === "title") return 0;
    if (f === "subtitle") return 1;
    if (f === "only_image") return 2;
    if (f === "only_text") return 3;
    return 4;
}

function gridAreaSortIndex(areaCode, gridOrder) {
    if (!areaCode) return 9999;
    const idx = gridOrder.indexOf(areaCode);
    return idx >= 0 ? idx : 9999;
}

function sortChunksForSlotSaveOrder(rows, gridOrder) {
    return [...rows].sort((a, b) => {
        const pa = plain(a);
        const pb = plain(b);
        const ra = chunkFormatSaveRank(pa.publication_article_chunk_format);
        const rb = chunkFormatSaveRank(pb.publication_article_chunk_format);
        if (ra !== rb) return ra - rb;
        const ia = gridAreaSortIndex(primaryGridAreaCode(pa.chunk_area_array), gridOrder);
        const ib = gridAreaSortIndex(primaryGridAreaCode(pb.chunk_area_array), gridOrder);
        if (ia !== ib) return ia - ib;
        const posDiff = Number(pa.chunk_position) - Number(pb.chunk_position);
        if (posDiff !== 0) return posDiff;
        return String(pa.publication_article_chunk_id ?? "").localeCompare(
            String(pb.publication_article_chunk_id ?? "")
        );
    });
}

async function assignOrphanOnlyTextAreasOnSlot(rows, columnCount, transaction) {
    const gridOrder = gridCellOverflowOrder(columnCount);
    const onlyText = rows.filter(
        (r) => String(r.get("publication_article_chunk_format") ?? "").toLowerCase() === "only_text"
    );
    const occupied = new Set();
    const orphans = [];
    for (const row of onlyText) {
        const area = primaryGridAreaCode(row.get("chunk_area_array"));
        if (area) occupied.add(area);
        else orphans.push(row);
    }
    let orphanIdx = 0;
    for (const code of gridOrder) {
        if (occupied.has(code)) continue;
        const orphan = orphans[orphanIdx++];
        if (!orphan) break;
        await orphan.update({ chunk_area_array: [code] }, { transaction: transaction ?? undefined });
        occupied.add(code);
    }
    for (let i = orphanIdx; i < orphans.length; i++) {
        await orphans[i].destroy({ transaction: transaction ?? undefined });
    }
}

/**
 * Removes duplicate `only_text` chunks that share the same slot + primary grid area.
 * Keeps the row with the latest `publication_article_chunk_updated_at`.
 */
export async function dedupeOverlappingGridTextChunks(
    publicationArticleId,
    transaction = null,
    options = {}
) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) return { deleted: 0 };
    const preferKeep = new Set(
        (Array.isArray(options.preferKeepChunkIds) ? options.preferKeepChunkIds : [])
            .map((cid) => String(cid ?? "").trim())
            .filter(Boolean)
    );

    let rows;
    try {
        rows = await PublicationArticleChunkDbModel.findAll({
            where: {
                publication_article_id: id,
                publication_article_chunk_format: "only_text",
                publication_slot_id: { [Op.ne]: null },
            },
            transaction: transaction ?? undefined,
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return { deleted: 0 };
        throw error;
    }

    const groups = new Map();
    for (const row of rows) {
        const p = plain(row);
        const sid = Number(p.publication_slot_id);
        const area = primaryGridAreaCode(p.chunk_area_array);
        if (!Number.isInteger(sid) || sid <= 0 || !area) continue;
        const key = `${sid}|${area}`;
        const list = groups.get(key) ?? [];
        list.push(row);
        groups.set(key, list);
    }

    let deleted = 0;
    for (const list of groups.values()) {
        if (list.length < 2) continue;
        const withContent = list.filter((row) => {
            const p = plain(row);
            return String(p.chunk_html ?? "").trim().length > 0;
        });
        if (withContent.length >= 2) continue;
        const ranked = [...list].sort((a, b) => {
            const pa = plain(a);
            const pb = plain(b);
            const aPref = preferKeep.has(String(pa.publication_article_chunk_id ?? "")) ? 1 : 0;
            const bPref = preferKeep.has(String(pb.publication_article_chunk_id ?? "")) ? 1 : 0;
            if (bPref !== aPref) return bPref - aPref;
            const lenA = String(pa.chunk_html ?? "").trim().length;
            const lenB = String(pb.chunk_html ?? "").trim().length;
            if (lenB !== lenA) return lenB - lenA;
            const ua = pa.publication_article_chunk_updated_at
                ? new Date(pa.publication_article_chunk_updated_at).getTime()
                : 0;
            const ub = pb.publication_article_chunk_updated_at
                ? new Date(pb.publication_article_chunk_updated_at).getTime()
                : 0;
            if (ub !== ua) return ub - ua;
            return Number(pb.chunk_position) - Number(pa.chunk_position);
        });
        for (let i = 1; i < ranked.length; i++) {
            await ranked[i].destroy({ transaction: transaction ?? undefined });
            deleted += 1;
        }
    }
    return { deleted };
}

/**
 * On explicit save: dedupe grid `only_text` by slot+area (newest `updated_at` wins),
 * assign areas to legacy orphans, then renumber `chunk_position` per slot to match
 * title → subtitle → images → body cells in grid order.
 */
export async function reconcilePublicationArticleChunks(publicationArticleId, options = {}) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const dedupeOptions = {
        preferKeepChunkIds: Array.isArray(options.preferKeepChunkIds)
            ? options.preferKeepChunkIds
            : [],
    };

    const article = await PublicationArticleDbModel.findByPk(id);
    if (!article) throw httpError(404, "publication_article not found");

    const layout = await getPublicationArticleMagazinePageLayout(id);
    const columnCount = String(layout ?? "").includes("3_col") ? 3 : 2;
    const gridOrder = gridCellOverflowOrder(columnCount);

    const ap = article.get({ plain: true });
    const orderedFromArticle = Array.isArray(ap.publication_slots_id_array)
        ? ap.publication_slots_id_array
              .map((n) => Number(n))
              .filter((n) => Number.isInteger(n) && n > 0)
        : [];

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    let deleted = 0;
    let positionsUpdated = 0;

    await sequelize.transaction(async (transaction) => {
        const dedupe1 = await dedupeOverlappingGridTextChunks(id, transaction, dedupeOptions);
        deleted += dedupe1.deleted;

        let slotRows = [];
        try {
            slotRows = await PublicationArticleChunkDbModel.findAll({
                attributes: ["publication_slot_id"],
                where: {
                    publication_article_id: id,
                    publication_slot_id: { [Op.ne]: null },
                },
                transaction,
            });
        } catch (error) {
            if (isMissingContentsManagerTable(error)) return;
            throw error;
        }

        const slotIdSet = new Set(orderedFromArticle);
        for (const row of slotRows) {
            const sid = Number(row.get("publication_slot_id"));
            if (Number.isInteger(sid) && sid > 0) slotIdSet.add(sid);
        }

        const slotIds = [
            ...orderedFromArticle.filter((sid) => slotIdSet.has(sid)),
            ...[...slotIdSet].filter((sid) => !orderedFromArticle.includes(sid)).sort((a, b) => a - b),
        ];

        for (const slotId of slotIds) {
            const rows = await PublicationArticleChunkDbModel.findAll({
                where: {
                    publication_article_id: id,
                    publication_slot_id: slotId,
                },
                transaction,
            });
            await assignOrphanOnlyTextAreasOnSlot(rows, columnCount, transaction);
        }

        const dedupe2 = await dedupeOverlappingGridTextChunks(id, transaction, dedupeOptions);
        deleted += dedupe2.deleted;

        for (const slotId of slotIds) {
            const rows = await PublicationArticleChunkDbModel.findAll({
                where: {
                    publication_article_id: id,
                    publication_slot_id: slotId,
                },
                transaction,
            });

            const ordered = sortChunksForSlotSaveOrder(rows, gridOrder);
            for (let pos = 0; pos < ordered.length; pos++) {
                const current = Number(plain(ordered[pos]).chunk_position);
                if (current === pos) continue;
                await ordered[pos].update({ chunk_position: pos }, { transaction });
                positionsUpdated += 1;
            }
        }
    });

    return { deleted, positions_updated: positionsUpdated };
}

/**
 * Loads `publication_articles` rows for a given publication and joins each one
 * with the source article in `articles_db` so the UI can render title /
 * subtitle / cover image without an extra round trip.
 */
export async function listPublicationArticles(publicationId) {
    const pid = String(publicationId ?? "").trim();
    if (!pid) return [];

    let rows;
    try {
        rows = await PublicationArticleDbModel.findAll({
            where: { publication_id: pid },
            order: [["publication_article_created_at", "ASC"]],
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return [];
        throw error;
    }

    const items = rows.map(toApiPublicationArticle).filter(Boolean);
    if (!items.length) return items;

    const sequelize = PublicationArticleDbModel.sequelize;
    const articleIds = [...new Set(items.map((i) => i.article_id).filter(Boolean))];
    const articleMetaById = new Map();
    const chunkCountByPublicationArticleId = new Map();

    if (sequelize && articleIds.length) {
        try {
            const meta = await sequelize.query(
                `SELECT id_article, article_title, article_subtitle, article_main_image_url, article_date
                 FROM public.articles_db
                 WHERE id_article IN (:ids)`,
                {
                    replacements: { ids: articleIds },
                    type: QueryTypes.SELECT,
                }
            );
            for (const m of meta) {
                articleMetaById.set(String(m.id_article), {
                    article_title: m.article_title ?? "",
                    article_subtitle: m.article_subtitle ?? null,
                    article_main_image_url: m.article_main_image_url ?? null,
                    article_date: m.article_date ?? null,
                });
            }
        } catch (error) {
            // Soft-fail: keep rows even if articles_db lookup fails.
            console.warn(
                "[PublicationArticleService] articles_db lookup failed:",
                error?.message ?? error
            );
        }
    }

    try {
        const counts = await PublicationArticleChunkDbModel.findAll({
            attributes: [
                "publication_article_id",
                [
                    PublicationArticleChunkDbModel.sequelize.fn(
                        "COUNT",
                        PublicationArticleChunkDbModel.sequelize.col(
                            "publication_article_chunk_id"
                        )
                    ),
                    "chunks_count",
                ],
            ],
            where: { publication_article_id: { [Op.in]: items.map((i) => i.publication_article_id) } },
            group: ["publication_article_id"],
            raw: true,
        });
        for (const c of counts) {
            chunkCountByPublicationArticleId.set(
                String(c.publication_article_id),
                Number(c.chunks_count) || 0
            );
        }
    } catch (error) {
        if (!isMissingContentsManagerTable(error)) {
            console.warn(
                "[PublicationArticleService] chunks count failed:",
                error?.message ?? error
            );
        }
    }

    return items.map((item) => ({
        ...item,
        article: articleMetaById.get(String(item.article_id)) ?? null,
        chunks_count: chunkCountByPublicationArticleId.get(item.publication_article_id) ?? 0,
    }));
}

/**
 * Creates a new `publication_articles` row linking the given publication and
 * the given source article. Throws 409 if the pair already exists. Does NOT
 * import chunks: the article builder will call
 * `initializePublicationArticleChunksFromSource` the first time it loads.
 */
export async function addPublicationArticle({ publicationId, articleId }) {
    const pid = String(publicationId ?? "").trim();
    const aid = String(articleId ?? "").trim();
    if (!pid || !aid) {
        throw httpError(400, "publication_id and article_id are required");
    }
    let row;
    try {
        const existing = await PublicationArticleDbModel.findOne({
            where: { publication_id: pid, article_id: aid },
        });
        if (existing) {
            throw httpError(409, "This article is already selected for this publication");
        }
        row = await PublicationArticleDbModel.create({
            publication_id: pid,
            article_id: aid,
            publication_slots_id_array: [],
            desired_page_count: 1,
        });
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
    try {
        const pubRow = await PublicationModel.findByPk(pid);
        if (pubRow) {
            await ensureArticleScreenshotsFolderHierarchy(pubRow, aid);
        }
    } catch (e) {
        console.warn(
            "[PublicationArticleService] ensure article Screenshots folder:",
            e?.message ?? e
        );
    }
    return toApiPublicationArticle(row);
}

/**
 * Creates a publication_article without a portal article (`articles_db` row).
 * Uses a synthetic `article_id` (prefix {@link STANDALONE_PUBLICATION_ARTICLE_PREFIX}).
 */
export async function addStandalonePublicationArticle({ publicationId, desiredPageCount = 1 }) {
    const pid = String(publicationId ?? "").trim();
    const dpc = Number(desiredPageCount);
    if (!pid) throw httpError(400, "publication_id is required");
    if (!Number.isInteger(dpc) || dpc < 1) {
        throw httpError(400, "desired_page_count must be a positive integer");
    }
    const articleId = `${STANDALONE_PUBLICATION_ARTICLE_PREFIX}${randomUUID()}`;
    let row;
    try {
        row = await PublicationArticleDbModel.create({
            publication_id: pid,
            article_id: articleId,
            publication_slots_id_array: [],
            desired_page_count: dpc,
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
    try {
        const pubRow = await PublicationModel.findByPk(pid);
        if (pubRow) {
            await ensureArticleScreenshotsFolderHierarchy(pubRow, articleId);
        }
    } catch (e) {
        console.warn(
            "[PublicationArticleService] ensure article Screenshots folder (standalone):",
            e?.message ?? e
        );
    }
    return toApiPublicationArticle(row);
}

function escapeXmlText(s) {
    return String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function textToParagraphHtml(text) {
    const safe = escapeXmlText(text).trim();
    return safe ? `<p>${safe}</p>` : "";
}

async function fetchArticleTitleSubtitleFromDb(sequelize, articleId, { transaction } = {}) {
    if (!articleId) return { titleText: "", subtitleText: "" };
    try {
        const rows = await sequelize.query(
            `SELECT article_title, article_subtitle
             FROM public.articles_db
             WHERE id_article = :aid
             LIMIT 1`,
            {
                replacements: { aid: String(articleId) },
                type: QueryTypes.SELECT,
                transaction,
            }
        );
        const r = rows?.[0];
        return {
            titleText: String(r?.article_title ?? "").trim(),
            subtitleText: String(r?.article_subtitle ?? "").trim(),
        };
    } catch (error) {
        console.warn(
            "[PublicationArticleService] articles_db title/subtitle lookup failed:",
            error?.message ?? error
        );
        return { titleText: "", subtitleText: "" };
    }
}

/**
 * Reads `magazine_page_layout` from `publication_slots_db`.
 * @param {number} slotId
 * @returns {Promise<import("./magazinePageLayout.js").MagazinePageLayout>}
 */
export async function readMagazinePageLayoutFromSlot(slotId) {
    const sid = Number(slotId);
    if (!Number.isInteger(sid) || sid <= 0) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
    let row;
    try {
        row = await PublicationSlotDbModel.findByPk(sid, {
            attributes: ["magazine_page_layout"],
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
        throw error;
    }
    if (!row) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
    return normalizeMagazinePageLayout(row.get("magazine_page_layout"));
}

/**
 * Sets `magazine_page_layout` on the given slot rows.
 * @param {number[]} slotIds
 * @param {unknown} layout
 */
export async function updateMagazinePageLayoutForSlotIds(slotIds, layout) {
    const normalized = normalizeMagazinePageLayout(layout);
    const ids = [...new Set(slotIds.map(Number).filter((n) => Number.isInteger(n) && n > 0))];
    if (!ids.length) {
        return { magazine_page_layout: normalized, updated_slot_count: 0 };
    }
    let updated = 0;
    try {
        const [n] = await PublicationSlotDbModel.update(
            { magazine_page_layout: normalized },
            { where: { publication_slot_id: { [Op.in]: ids } } }
        );
        updated = Number(n) || 0;
    } catch (error) {
        if (isMissingContentsManagerTable(error)) {
            return { magazine_page_layout: normalized, updated_slot_count: 0 };
        }
        throw error;
    }
    return { magazine_page_layout: normalized, updated_slot_count: updated };
}

/**
 * Ensures exactly one `title` and one `subtitle` chunk exist for a magazine
 * page (`publication_slot_id`). Seeds new rows from `articles_db`
 * title/subtitle when creating them. Removes duplicate title/subtitle rows
 * (keeps the earliest `chunk_position`).
 *
 * @param {string} publicationArticleId
 * @param {number} publicationSlotId
 * @param {{
 *   transaction?: import("sequelize").Transaction;
 *   includeTitleSubtitle?: boolean;
 * }} [options] When `includeTitleSubtitle` is false, strips title/subtitle from this slot (pages after page 1). Default true.
 */
export async function ensureMagazineSlotTitleSubtitleChunks(
    publicationArticleId,
    publicationSlotId,
    options = {}
) {
    const paId = String(publicationArticleId ?? "").trim();
    const slotId = Number(publicationSlotId);
    const { transaction: outerTx, includeTitleSubtitle = true } = options;
    if (!paId) throw httpError(400, "publication_article_id is required");
    if (!Number.isInteger(slotId) || slotId <= 0) {
        throw httpError(400, "publication_slot_id must be a positive integer");
    }

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    const run = async (transaction) => {
        const article = await PublicationArticleDbModel.findByPk(paId, { transaction });
        if (!article) throw httpError(404, "publication_article not found");
        const ap = article.get({ plain: true });

        const { titleText, subtitleText } = await fetchArticleTitleSubtitleFromDb(
            sequelize,
            ap.article_id,
            { transaction }
        );
        const defaultTitleHtml = textToParagraphHtml(titleText) || "<p></p>";
        const defaultSubtitleHtml = textToParagraphHtml(subtitleText);

        const reloadChunks = () =>
            PublicationArticleChunkDbModel.findAll({
                where: {
                    publication_article_id: paId,
                    publication_slot_id: slotId,
                },
                order: [["chunk_position", "ASC"]],
                transaction,
            });

        let chunks = await reloadChunks();

        const byFormat = (fmt) =>
            chunks
                .map((c) => plain(c))
                .filter((c) => String(c.publication_article_chunk_format) === fmt)
                .sort((a, b) => a.chunk_position - b.chunk_position);

        const destroyDupes = async (format) => {
            const list = byFormat(format);
            if (list.length <= 1) return;
            const [, ...dupes] = list;
            await PublicationArticleChunkDbModel.destroy({
                where: {
                    publication_article_chunk_id: {
                        [Op.in]: dupes.map((d) => d.publication_article_chunk_id),
                    },
                },
                transaction,
            });
        };

        if (!includeTitleSubtitle) {
            await PublicationArticleChunkDbModel.destroy({
                where: {
                    publication_article_id: paId,
                    publication_slot_id: slotId,
                    publication_article_chunk_format: { [Op.in]: ["title", "subtitle"] },
                },
                transaction,
            });
        } else {
            await destroyDupes("title");
            await destroyDupes("subtitle");
            chunks = await reloadChunks();

            const plainChunks = chunks.map((c) => plain(c));
            const hasTitle = plainChunks.some((c) => c.publication_article_chunk_format === "title");
            const hasSubtitle = plainChunks.some(
                (c) => c.publication_article_chunk_format === "subtitle"
            );

            const bumpPositionsFrom = async (fromInclusive) => {
                await PublicationArticleChunkDbModel.increment(
                    { chunk_position: 1 },
                    {
                        where: {
                            publication_article_id: paId,
                            publication_slot_id: slotId,
                            chunk_position: { [Op.gte]: fromInclusive },
                        },
                        transaction,
                    }
                );
            };

            if (!hasTitle) {
                await bumpPositionsFrom(0);
                await PublicationArticleChunkDbModel.create(
                    {
                        publication_article_id: ap.publication_article_id,
                        publication_id: ap.publication_id,
                        publication_slot_id: slotId,
                        publication_article_chunk_format: "title",
                        chunk_html: defaultTitleHtml,
                        chunk_position: 0,
                        original_article_content_id: null,
                    },
                    { transaction }
                );
            }
            if (!hasSubtitle) {
                await bumpPositionsFrom(1);
                await PublicationArticleChunkDbModel.create(
                    {
                        publication_article_id: ap.publication_article_id,
                        publication_id: ap.publication_id,
                        publication_slot_id: slotId,
                        publication_article_chunk_format: "subtitle",
                        chunk_html: defaultSubtitleHtml,
                        chunk_position: 1,
                        original_article_content_id: null,
                    },
                    { transaction }
                );
            }
        }

        const spreadSlotIds = Array.isArray(ap.publication_slots_id_array)
            ? ap.publication_slots_id_array
                  .map((n) => Number(n))
                  .filter((n) => Number.isInteger(n) && n > 0)
            : [];
        const primarySlotId = spreadSlotIds.length > 0 ? spreadSlotIds[0] : slotId;
        const isPrimaryContentSlot = Number(slotId) === Number(primarySlotId);

        if (isPrimaryContentSlot) {
            await ensureArticleBodyChunksFromSourceForMagazinePage(ap, paId, slotId, transaction);
        }
        await ensureDefaultColumnBodyChunksForMagazinePage(ap, paId, slotId, transaction);

        return { ok: true };
    };

    if (outerTx) {
        return run(outerTx);
    }
    return sequelize.transaction((transaction) => run(transaction));
}

/**
 * Runs {@link ensureMagazineSlotTitleSubtitleChunks} for every slot id in
 * `publication_slots_id_array` (article magazine pages).
 */
export async function ensureAllMagazineSlotTitleSubtitleChunks(publicationArticleId) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const article = await PublicationArticleDbModel.findByPk(id);
    if (!article) throw httpError(404, "publication_article not found");
    const ap = article.get({ plain: true });
    const slotIds = Array.isArray(ap.publication_slots_id_array)
        ? ap.publication_slots_id_array.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    if (!slotIds.length) return { ensured_pages: 0 };

    let ensured = 0;
    for (let i = 0; i < slotIds.length; i++) {
        const sid = Number(slotIds[i]);
        if (!Number.isInteger(sid) || sid <= 0) continue;
        try {
            await ensureMagazineSlotTitleSubtitleChunks(id, sid, {
                includeTitleSubtitle: i === 0,
            });
            ensured += 1;
        } catch (error) {
            if (isMissingContentsManagerTable(error)) continue;
            throw error;
        }
    }
    return { ensured_pages: ensured };
}

/**
 * Reads magazine page layout from the first slot in `publication_slots_id_array`.
 * @param {string} publicationArticleId
 * @returns {Promise<import("./magazinePageLayout.js").MagazinePageLayout>}
 */
export async function getPublicationArticleMagazinePageLayout(publicationArticleId) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
    let article;
    try {
        article = await PublicationArticleDbModel.findByPk(id, {
            attributes: ["publication_slots_id_array"],
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
        throw error;
    }
    if (!article) return DEFAULT_MAGAZINE_PAGE_LAYOUT;
    const slotIds = Array.isArray(article.get("publication_slots_id_array"))
        ? article
              .get("publication_slots_id_array")
              .map((n) => Number(n))
              .filter((n) => Number.isInteger(n) && n > 0)
        : [];
    if (!slotIds.length) return DEFAULT_MAGAZINE_PAGE_LAYOUT;

    return readMagazinePageLayoutFromSlot(slotIds[0]);
}

/**
 * Applies the same magazine page layout to every slot in `publication_slots_id_array`.
 * @param {string} publicationArticleId
 * @param {unknown} layout
 */
export async function setPublicationArticleMagazinePageLayout(publicationArticleId, layout) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");

    const article = await PublicationArticleDbModel.findByPk(id);
    if (!article) throw httpError(404, "publication_article not found");

    const slotIds = Array.isArray(article.get("publication_slots_id_array"))
        ? article
              .get("publication_slots_id_array")
              .map((n) => Number(n))
              .filter((n) => Number.isInteger(n) && n > 0)
        : [];
    if (!slotIds.length) {
        const normalized = normalizeMagazinePageLayout(layout);
        return { magazine_page_layout: normalized, updated_slot_content_count: 0 };
    }

    const result = await updateMagazinePageLayoutForSlotIds(slotIds, layout);
    return {
        magazine_page_layout: result.magazine_page_layout,
        updated_slot_content_count: result.updated_slot_count,
    };
}

/**
 * Loads the publication_article row plus its chunks, ordered by chunk_position.
 *
 * @param {string} publicationArticleId
 * @param {{ ensureSlotId?: number, ensureSlotContentId?: number, ensureAllMagazineSlots?: boolean }} [options]
 */
export async function getPublicationArticleWithChunks(publicationArticleId, options = {}) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    let row;
    try {
        row = await PublicationArticleDbModel.findByPk(id);
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return null;
        throw error;
    }
    if (!row) return null;

    const ensureAll = Boolean(options.ensureAllMagazineSlots);
    const rawSlot =
        options.ensureSlotId != null ? options.ensureSlotId : options.ensureSlotContentId;
    const esc = rawSlot;
    const ensureOne =
        esc != null && Number.isFinite(Number(esc)) && Number.isInteger(Number(esc)) && Number(esc) > 0;

    try {
        if (ensureAll) {
            await ensureAllMagazineSlotTitleSubtitleChunks(id);
        } else if (ensureOne) {
            const sidOne = Number(esc);
            const spreadSync = await ensureSlotInPublicationArticleSpread(id, sidOne);
            if (spreadSync.status === "appended") {
                row = await PublicationArticleDbModel.findByPk(id);
            }
            const apOne = row ? row.get({ plain: true }) : null;
            const includeTs =
                apOne &&
                Number.isInteger(sidOne) &&
                isFirstSlotInPublicationArticleSlotsArray(apOne.publication_slots_id_array, sidOne);
            await ensureMagazineSlotTitleSubtitleChunks(id, sidOne, {
                includeTitleSubtitle: Boolean(includeTs),
            });
        }
        await assignUnassignedChunksWhenSinglePage(id, null);
    } catch (error) {
        if (isMissingContentsManagerTable(error)) {
            // keep going without ensure when chunks table missing
        } else {
            throw error;
        }
    }

    try {
        await dedupeOverlappingGridTextChunks(id, null);
    } catch (error) {
        if (!isMissingContentsManagerTable(error)) throw error;
    }

    let chunks = [];
    try {
        chunks = await PublicationArticleChunkDbModel.findAll({
            where: { publication_article_id: id },
            order: [["chunk_position", "ASC"]],
        });
    } catch (error) {
        if (!isMissingContentsManagerTable(error)) throw error;
    }
    const magazine_page_layout = await getPublicationArticleMagazinePageLayout(id);
    return {
        publication_article: toApiPublicationArticle(row),
        chunks: chunks.map(toApiChunk).filter(Boolean),
        magazine_page_layout,
    };
}

async function publicationArticleSlotClaimedByOtherPublicationArticle(
    publicationArticleId,
    publicationId,
    slotId,
    transaction
) {
    const sid = Number(slotId);
    const pid = String(publicationId ?? "").trim();
    const excludePaId = String(publicationArticleId ?? "").trim();
    if (!Number.isInteger(sid) || sid <= 0 || !pid) return false;
    let rows;
    try {
        rows = await PublicationArticleDbModel.findAll({
            where: { publication_id: pid },
            attributes: ["publication_article_id", "publication_slots_id_array"],
            transaction,
        });
    } catch {
        return false;
    }
    for (const r of rows) {
        if (String(r.get("publication_article_id")) === excludePaId) continue;
        const arr = r.get("publication_slots_id_array");
        if (!Array.isArray(arr)) continue;
        if (arr.map(Number).includes(sid)) return true;
    }
    return false;
}

/**
 * If a `regular_page` slot is still typed as something other than `article`
 * (e.g. `advert` from Flatplan), re-types it to `article`, sets `slot_article_id`,
 * and assigns orphan chunks to this slot.
 *
 * @param {string} publicationId
 * @param {string} publicationArticleId
 * @param {number} publicationSlotId
 * @param {import("sequelize").Transaction | null | undefined} transaction
 */
async function coerceRegularPageSlotToArticleForPublicationArticle(
    publicationId,
    publicationArticleId,
    publicationSlotId,
    transaction
) {
    const pid = String(publicationId ?? "").trim();
    const paId = String(publicationArticleId ?? "").trim();
    const sid = Number(publicationSlotId);
    if (!pid || !paId || !Number.isInteger(sid) || sid <= 0) {
        throw httpError(400, "Invalid parameters for slot coercion.");
    }

    const slot = await PublicationSlotDbModel.findOne({
        where: { publication_id: pid, publication_slot_id: sid },
        transaction: transaction ?? undefined,
        lock: transaction?.LOCK?.UPDATE,
    });
    if (!slot) {
        throw httpError(
            400,
            "One or more publication_slot_id values do not belong to this publication."
        );
    }
    const key = String(slot.get("slot_key") ?? "").trim().toLowerCase();
    if (key !== ARTICLE_PAGE_SLOT_KEY) {
        throw httpError(
            400,
            "Only regular_page slots can be assigned to a publication article page."
        );
    }
    const ctype = String(slot.get("slot_content_type") ?? "").trim().toLowerCase();

    const article = await PublicationArticleDbModel.findByPk(paId, {
        transaction: transaction ?? undefined,
    });
    if (!article) throw httpError(404, "publication_article not found");
    const ap = article.get({ plain: true });
    const articleIdForSlot = String(ap.article_id ?? "").trim() || null;

    if (ctype !== "article") {
        await slot.update(
            {
                slot_content_type: "article",
                slot_state: ARTICLE_PAGE_SLOT_STATE,
                slot_article_id: articleIdForSlot,
                slot_media_url: null,
            },
            { transaction: transaction ?? undefined }
        );
        await PublicationArticleChunkDbModel.update(
            { publication_slot_id: sid },
            {
                where: {
                    publication_article_id: paId,
                    publication_slot_id: { [Op.is]: null },
                },
                transaction: transaction ?? undefined,
            }
        );
    } else if (articleIdForSlot && !String(slot.get("slot_article_id") ?? "").trim()) {
        await slot.update(
            { slot_article_id: articleIdForSlot },
            { transaction: transaction ?? undefined }
        );
    }

    const includeTs = isFirstSlotInPublicationArticleSlotsArray(ap.publication_slots_id_array, sid);
    await ensureMagazineSlotTitleSubtitleChunks(paId, sid, {
        transaction,
        includeTitleSubtitle: includeTs,
    });
    const pubRow = await PublicationModel.findByPk(String(pid), {
        transaction: transaction ?? undefined,
    });
    if (pubRow) {
        try {
            await ensureArticleSlotMaterialsFolderHierarchy(pubRow, ap.article_id, sid, {
                transaction,
            });
        } catch (e) {
            console.warn(
                "[PublicationArticleService] ensure article slot mediateca folder (coerce):",
                e?.message ?? e
            );
        }
    }
}

async function assertPublicationSlotsBelongToPublicationAndArticleTyped(
    publicationId,
    slotIds,
    transaction
) {
    const pid = String(publicationId ?? "").trim();
    const ids = Array.from(new Set(slotIds.map(Number).filter((n) => Number.isFinite(n) && n > 0)));
    if (!ids.length) return;
    const rows = await PublicationSlotDbModel.findAll({
        where: { publication_id: pid, publication_slot_id: { [Op.in]: ids } },
        attributes: ["publication_slot_id", "slot_key", "slot_content_type"],
        transaction,
    });
    if (rows.length !== ids.length) {
        throw httpError(
            400,
            "One or more publication_slot_id values do not belong to this publication."
        );
    }
    for (const r of rows) {
        const key = String(r.get("slot_key") ?? "").trim().toLowerCase();
        const ctype = String(r.get("slot_content_type") ?? "").trim().toLowerCase();
        if (key !== ARTICLE_PAGE_SLOT_KEY || ctype !== "article") {
            throw httpError(
                400,
                "Only regular_page slots with type article can be assigned to a publication article."
            );
        }
    }
}

/**
 * Updates `desired_page_count`, `publication_slots_id_array`, and/or
 * `publication_article_state` on a publication_article row. Returns the API-shaped updated row.
 */
export async function updatePublicationArticle(publicationArticleId, payload) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const updates = {};
    if (payload?.desired_page_count !== undefined) {
        const n = Number(payload.desired_page_count);
        if (!Number.isInteger(n) || n < 1) {
            throw httpError(400, "desired_page_count must be a positive integer");
        }
        updates.desired_page_count = n;
    }
    if (payload?.publication_slots_id_array !== undefined) {
        if (!Array.isArray(payload.publication_slots_id_array)) {
            throw httpError(400, "publication_slots_id_array must be an array");
        }
        const arr = payload.publication_slots_id_array
            .map((v) => Number(v))
            .filter((n) => Number.isFinite(n));
        updates.publication_slots_id_array = arr;
    }
    if (payload?.publication_article_state !== undefined) {
        const raw = String(payload.publication_article_state ?? "").trim();
        if (!PUBLICATION_ARTICLE_STATE_VALUES.includes(raw)) {
            throw httpError(
                400,
                `publication_article_state must be one of: ${PUBLICATION_ARTICLE_STATE_VALUES.join(
                    ", "
                )}`
            );
        }
        updates.publication_article_state = raw;
    }
    if (payload?.publication_art_name !== undefined) {
        const raw = payload.publication_art_name;
        updates.publication_art_name =
            raw == null || String(raw).trim() === "" ? null : String(raw).trim().slice(0, 255);
    }
    if (payload?.has_article_box !== undefined) {
        const v = payload.has_article_box;
        updates.has_article_box = v == null ? null : Boolean(v);
    }
    const boxFields = [
        "box_company_name",
        "box_company_direction",
        "box_company_city",
        "box_company_email",
        "box_company_phone",
        "box_company_web",
    ];
    for (const key of boxFields) {
        if (payload?.[key] === undefined) continue;
        const raw = payload[key];
        updates[key] = raw == null || String(raw).trim() === "" ? null : String(raw).trim();
    }
    if (!Object.keys(updates).length) {
        const row = await PublicationArticleDbModel.findByPk(id);
        return row ? toApiPublicationArticle(row) : null;
    }
    let row;
    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");
    try {
        const needsSlotCoercion =
            updates.publication_slots_id_array !== undefined &&
            updates.publication_slots_id_array.length > 0;

        if (needsSlotCoercion) {
            await sequelize.transaction(async (transaction) => {
                row = await PublicationArticleDbModel.findByPk(id, {
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });
                if (!row) throw httpError(404, "publication_article not found");
                const publicationId = String(row.get("publication_id") ?? "").trim();
                for (const slotId of updates.publication_slots_id_array) {
                    await coerceRegularPageSlotToArticleForPublicationArticle(
                        publicationId,
                        id,
                        slotId,
                        transaction
                    );
                }
                await assertPublicationSlotsBelongToPublicationAndArticleTyped(
                    publicationId,
                    updates.publication_slots_id_array,
                    transaction
                );
                await row.update(updates, { transaction });
            });
        } else {
            row = await PublicationArticleDbModel.findByPk(id);
            if (!row) throw httpError(404, "publication_article not found");
            await row.update(updates);
        }
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
    return toApiPublicationArticle(row);
}

/**
 * Removes a publication_article row and every chunk attached to it. Slots
 * referenced through `publication_slots_id_array` are NOT deleted here; the
 * caller (UI) is expected to clean them up explicitly because they may have
 * other content beyond this article.
 */
export async function removePublicationArticle(publicationArticleId) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");
    try {
        await sequelize.transaction(async (transaction) => {
            await PublicationArticleChunkDbModel.destroy({
                where: { publication_article_id: id },
                transaction,
            });
            const deleted = await PublicationArticleDbModel.destroy({
                where: { publication_article_id: id },
                transaction,
            });
            if (!deleted) throw httpError(404, "publication_article not found");
        });
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
    return { ok: true, publication_article_id: id };
}

/**
 * Best-effort conversion from `article_contents.article_content_type` to one
 * of the magazine chunk formats. Falls back to `only_text`.
 */
function mapArticleContentTypeToChunkFormat(type) {
    const t = String(type ?? "").trim().toLowerCase();
    if (t === "title") return "title";
    if (t === "subtitle") return "subtitle";
    if (t === "image" || t === "main_image" || t === "gallery" || t === "just_image") return "only_image";
    if (t === "text_image" || t === "image_text") return t;
    return "only_text";
}

/** Renders portal `article_contents` into magazine `chunk_html`. */
function articleContentToHtml(type, content) {
    return portalArticleContentToHtml(type, content);
}

const MAGAZINE_BODY_TEXT_FORMATS = new Set(["only_text", "text_image", "image_text"]);

/**
 * For pages without floating overlay images, ensures one body text chunk per
 * grid cell (a1, a2, … c4). Skips slots with portal-imported body or overlays.
 */
async function ensureDefaultColumnBodyChunksForMagazinePage(ap, paId, slotId, transaction) {
    const layout = await getPublicationArticleMagazinePageLayout(paId);
    const columnCount = layout === "3_col_article" ? 3 : 2;

    const existing = await PublicationArticleChunkDbModel.findAll({
        where: {
            publication_article_id: paId,
            publication_slot_id: slotId,
        },
        order: [["chunk_position", "ASC"]],
        transaction,
    });

    const isOverlayChunk = (c) => {
        const fmt = String(c.get("publication_article_chunk_format") ?? "").toLowerCase();
        if (fmt !== "only_image") return false;
        return normalizeChunkAreaArray(c.get("chunk_area_array")).length > 0;
    };

    if (existing.some(isOverlayChunk)) {
        return;
    }

    const bodyChunks = existing.filter((c) =>
        MAGAZINE_BODY_TEXT_FORMATS.has(
            String(c.get("publication_article_chunk_format") ?? "").toLowerCase()
        )
    );

    const hasPortalBackedBody = bodyChunks.some((c) => {
        const o = c.get("original_article_content_id");
        return o != null && String(o).trim() !== "";
    });
    if (hasPortalBackedBody) return;

    if (hasCompletePerCellBodyGrid(bodyChunks, columnCount)) {
        return;
    }

    const chunkHtmlHasMeaningfulBody = (html) => {
        const t = String(html ?? "").trim();
        if (!t) return false;
        const plain = t
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
        return plain.length > 0;
    };

    if (bodyChunks.some((c) => chunkHtmlHasMeaningfulBody(c.get("chunk_html")))) {
        return;
    }

    if (bodyChunks.length > 0) {
        await PublicationArticleChunkDbModel.destroy({
            where: {
                publication_article_chunk_id: {
                    [Op.in]: bodyChunks.map((c) => c.get("publication_article_chunk_id")),
                },
            },
            transaction,
        });
    }

    let maxPos = -1;
    for (const c of existing) {
        const pos = Number(plain(c).chunk_position);
        if (Number.isFinite(pos)) maxPos = Math.max(maxPos, pos);
    }

    for (const code of perCellBodyGridAreaCodes(columnCount)) {
        const occupied = await findOnlyTextChunkInGridArea(paId, slotId, code, null);
        if (occupied) continue;
        maxPos += 1;
        await PublicationArticleChunkDbModel.create(
            {
                publication_article_id: paId,
                publication_id: ap.publication_id,
                publication_slot_id: slotId,
                publication_article_chunk_format: "only_text",
                chunk_html: "<p></p>",
                chunk_position: maxPos,
                chunk_area_array: [code],
                original_article_content_id: null,
            },
            { transaction }
        );
    }
}

/**
 * Ensures every portal `article_contents` block (except title/subtitle, which
 * are represented by the fixed magazine title/subtitle chunks) has a matching
 * chunk on this magazine page, keyed by `original_article_content_id`.
 */
async function ensureArticleBodyChunksFromSourceForMagazinePage(ap, paId, slotId, transaction) {
    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) return;

    let sourceContents = [];
    try {
        sourceContents = await sequelize.query(
            `SELECT article_content_id, article_content_type, article_content_content, article_content_position
             FROM public.article_contents
             WHERE article_id = :aid
             ORDER BY article_content_position ASC`,
            {
                replacements: { aid: ap.article_id },
                type: QueryTypes.SELECT,
                transaction,
            }
        );
    } catch (error) {
        console.warn(
            "[PublicationArticleService] article_contents lookup (magazine page) failed:",
            error?.message ?? error
        );
        return;
    }
    if (!sourceContents.length) return;

    const existing = await PublicationArticleChunkDbModel.findAll({
        where: {
            publication_article_id: paId,
            publication_slot_id: slotId,
        },
        transaction,
    });
    let maxPos = -1;
    for (const c of existing) {
        const p = plain(c);
        const pos = Number(p.chunk_position);
        if (Number.isFinite(pos)) maxPos = Math.max(maxPos, pos);
    }

    /** One row per portal `article_content_id` for the whole adaptation (any slot). */
    let rowsWithOrig = [];
    try {
        rowsWithOrig = await PublicationArticleChunkDbModel.findAll({
            where: {
                publication_article_id: paId,
                original_article_content_id: { [Op.ne]: null },
            },
            attributes: ["original_article_content_id"],
            transaction,
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return;
        throw error;
    }
    const ocidUsedGlobally = new Set();
    for (const c of rowsWithOrig) {
        const p = plain(c);
        const o =
            p.original_article_content_id != null
                ? String(p.original_article_content_id).trim()
                : "";
        if (o) ocidUsedGlobally.add(o);
    }

    for (const sc of sourceContents) {
        const typ = String(sc.article_content_type ?? "").trim().toLowerCase();
        if (typ === "title" || typ === "subtitle") {
            continue;
        }
        const ocid =
            sc.article_content_id != null ? String(sc.article_content_id).trim() : "";
        if (!ocid) {
            continue;
        }
        if (ocidUsedGlobally.has(ocid)) {
            continue;
        }

        maxPos += 1;
        let format = mapArticleContentTypeToChunkFormat(sc.article_content_type);
        if (format === "title" || format === "subtitle") {
            format = "only_text";
        }

        await PublicationArticleChunkDbModel.create(
            {
                publication_article_id: paId,
                publication_id: ap.publication_id,
                publication_slot_id: slotId,
                publication_article_chunk_format: format,
                chunk_html: articleContentToHtml(
                    sc.article_content_type,
                    sc.article_content_content
                ),
                chunk_position: maxPos,
                original_article_content_id: ocid,
            },
            { transaction }
        );
        ocidUsedGlobally.add(ocid);
    }
}

/**
 * Imports the source `article_contents` rows of an article into chunks for a
 * publication_article. Skips silently if chunks are already present (so the
 * caller can call this idempotently on first article-builder visit).
 */
export async function initializePublicationArticleChunksFromSource(publicationArticleId) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    const article = await PublicationArticleDbModel.findByPk(id);
    if (!article) throw httpError(404, "publication_article not found");
    const articlePlain = article.get({ plain: true });

    const existing = await PublicationArticleChunkDbModel.count({
        where: { publication_article_id: id },
    });
    if (existing > 0) {
        return { initialized: false, reason: "already initialized", existing };
    }

    let sourceContents = [];
    try {
        sourceContents = await sequelize.query(
            `SELECT article_content_id, article_content_type, article_content_content, article_content_position
             FROM public.article_contents
             WHERE article_id = :aid
             ORDER BY article_content_position ASC`,
            {
                replacements: { aid: articlePlain.article_id },
                type: QueryTypes.SELECT,
            }
        );
    } catch (error) {
        console.warn(
            "[PublicationArticleService] article_contents lookup failed:",
            error?.message ?? error
        );
        sourceContents = [];
    }

    if (!sourceContents.length) {
        return { initialized: false, reason: "no source article_contents" };
    }

    const created = [];
    await sequelize.transaction(async (transaction) => {
        for (let i = 0; i < sourceContents.length; i++) {
            const sc = sourceContents[i];
            const fmt = mapArticleContentTypeToChunkFormat(sc.article_content_type);
            const chunk = await PublicationArticleChunkDbModel.create(
                {
                    publication_article_id: articlePlain.publication_article_id,
                    publication_id: articlePlain.publication_id,
                    publication_slot_id: null,
                    publication_article_chunk_format: fmt,
                    chunk_html: articleContentToHtml(
                        sc.article_content_type,
                        sc.article_content_content
                    ),
                    chunk_position: Number(sc.article_content_position) || i,
                    original_article_content_id:
                        sc.article_content_id != null ? String(sc.article_content_id) : null,
                },
                { transaction }
            );
            created.push(chunk);
        }
    });

    try {
        await assignUnassignedChunksWhenSinglePage(id, null);
    } catch (e) {
        console.warn(
            "[PublicationArticleService] single-page assign after source init:",
            e?.message ?? e
        );
    }

    return { initialized: true, created_count: created.length };
}

export async function listChunks(publicationArticleId) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    let chunks;
    try {
        chunks = await PublicationArticleChunkDbModel.findAll({
            where: { publication_article_id: id },
            order: [["chunk_position", "ASC"]],
        });
    } catch (error) {
        if (isMissingContentsManagerTable(error)) return [];
        throw error;
    }
    try {
        await dedupeOverlappingGridTextChunks(id, null);
        chunks = await PublicationArticleChunkDbModel.findAll({
            where: { publication_article_id: id },
            order: [["chunk_position", "ASC"]],
        });
    } catch (error) {
        if (!isMissingContentsManagerTable(error)) throw error;
    }
    return chunks.map(toApiChunk).filter(Boolean);
}

export async function createChunk(publicationArticleId, payload) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const article = await PublicationArticleDbModel.findByPk(id).catch((error) => {
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    });
    if (!article) throw httpError(404, "publication_article not found");
    const ap = article.get({ plain: true });
    const format = String(
        payload?.publication_article_chunk_format ?? "only_text"
    );
    if (!PUBLICATION_ARTICLE_CHUNK_FORMATS.includes(format)) {
        throw httpError(400, "Invalid publication_article_chunk_format");
    }
    let slotIdForCreate =
        payload?.publication_slot_id != null
            ? Number(payload.publication_slot_id)
            : payload?.publication_slot_content_id != null
              ? Number(payload.publication_slot_content_id)
              : null;
    if (slotIdForCreate == null || !Number.isFinite(slotIdForCreate)) {
        const arr = ap.publication_slots_id_array;
        const slotIds = Array.isArray(arr)
            ? arr.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
            : [];
        if (slotIds.length === 1) {
            const autoSlot = await getFirstArticleSlotId(id, null);
            if (Number.isInteger(autoSlot) && autoSlot > 0) {
                slotIdForCreate = autoSlot;
            }
        }
    }
    if (
        (format === "title" || format === "subtitle") &&
        Number.isInteger(slotIdForCreate)
    ) {
        const dup = await PublicationArticleChunkDbModel.count({
            where: {
                publication_article_id: id,
                publication_slot_id: slotIdForCreate,
                publication_article_chunk_format: format,
            },
        });
        if (dup > 0) {
            throw httpError(
                400,
                `This magazine page already has a ${format} chunk; title and subtitle cannot be duplicated.`
            );
        }
    }
    const areaArray = normalizeChunkAreaArray(payload?.chunk_area_array);
    if (
        format === "only_text" &&
        areaArray.length > 0 &&
        Number.isInteger(slotIdForCreate) &&
        slotIdForCreate > 0
    ) {
        const existing = await findOnlyTextChunkInGridArea(
            ap.publication_article_id,
            slotIdForCreate,
            areaArray[0]
        );
        if (existing) {
            const reuseUpdates = {};
            if (payload?.chunk_html !== undefined) {
                reuseUpdates.chunk_html = String(payload.chunk_html ?? "");
            }
            if (payload?.chunk_position !== undefined) {
                const n = Number(payload.chunk_position);
                if (Number.isFinite(n)) reuseUpdates.chunk_position = n;
            }
            if (Object.keys(reuseUpdates).length > 0) {
                await existing.update(reuseUpdates);
            }
            return toApiChunk(existing);
        }
    }
    const chunk = await PublicationArticleChunkDbModel.create({
        publication_article_id: ap.publication_article_id,
        publication_id: ap.publication_id,
        publication_slot_id:
            slotIdForCreate != null && Number.isFinite(Number(slotIdForCreate))
                ? Number(slotIdForCreate)
                : null,
        publication_article_chunk_format: format,
        chunk_html: String(payload?.chunk_html ?? ""),
        chunk_position: Number.isFinite(Number(payload?.chunk_position))
            ? Number(payload.chunk_position)
            : 0,
        chunk_area_array: areaArray,
        original_article_content_id:
            payload?.original_article_content_id != null
                ? String(payload.original_article_content_id)
                : null,
        chunk_image_caption:
            chunkFormatIncludesImage(format) &&
            payload?.chunk_image_caption !== undefined
                ? String(payload.chunk_image_caption ?? "")
                : "",
    });

    if (
        format === "only_image" &&
        areaArray.length > 0 &&
        slotIdForCreate != null &&
        Number.isFinite(Number(slotIdForCreate))
    ) {
        await clearTextChunksForImageAreas({
            publicationArticleId: ap.publication_article_id,
            slotId: Number(slotIdForCreate),
            imageAreas: areaArray,
        });
    }

    return toApiChunk(chunk);
}

/**
 * First `publication_slot_id` in the article's `publication_slots_id_array`.
 * @param {string} publicationArticleId
 * @param {import("sequelize").Transaction | null | undefined} transaction
 */
async function getFirstArticleSlotId(publicationArticleId, transaction) {
    const pa = await PublicationArticleDbModel.findByPk(String(publicationArticleId), {
        transaction: transaction ?? undefined,
    });
    if (!pa) return null;
    const arr = pa.get("publication_slots_id_array");
    const slotIds = Array.isArray(arr)
        ? arr.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    if (!slotIds.length) return null;
    const firstSid = Number(slotIds[0]);
    return Number.isInteger(firstSid) && firstSid > 0 ? firstSid : null;
}

/**
 * When a publication article has exactly one magazine slot, assigns any chunks
 * whose `publication_slot_id` is still null to that slot.
 */
async function assignUnassignedChunksWhenSinglePage(publicationArticleId, transaction) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) return;
    const pa = await PublicationArticleDbModel.findByPk(id, {
        attributes: ["publication_slots_id_array"],
        transaction: transaction ?? undefined,
    });
    if (!pa) return;
    const arr = pa.get("publication_slots_id_array");
    const slotIds = Array.isArray(arr)
        ? arr.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
        : [];
    if (slotIds.length !== 1) return;
    const firstSlotId = await getFirstArticleSlotId(id, transaction);
    if (firstSlotId == null) return;

    try {
        await PublicationArticleChunkDbModel.update(
            { publication_slot_id: firstSlotId },
            {
                where: {
                    publication_article_id: id,
                    publication_slot_id: { [Op.is]: null },
                },
                transaction: transaction ?? undefined,
            }
        );
    } catch (e) {
        if (isMissingContentsManagerTable(e)) return;
        throw e;
    }
}

export async function updateChunk(chunkId, payload) {
    const id = String(chunkId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_chunk_id is required");
    let row;
    try {
        row = await PublicationArticleChunkDbModel.findByPk(id);
    } catch (error) {
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_article_chunks table is not yet provisioned in this database (migration 035 pending)."
            );
        }
        throw error;
    }
    if (!row) throw httpError(404, "publication_article_chunk not found");

    const plainRow = plain(row);
    const currentFormat = String(plainRow.publication_article_chunk_format ?? "");
    const isTitleOrSubtitleFormat = LOCKED_MAGAZINE_CHUNK_FORMATS.has(currentFormat);

    if (isTitleOrSubtitleFormat && payload?.publication_article_chunk_format !== undefined) {
        const nextF = String(payload.publication_article_chunk_format);
        if (nextF !== currentFormat) {
            throw httpError(400, "Title and subtitle chunks cannot change format.");
        }
    }

    const payloadSlotRaw =
        payload?.publication_slot_id !== undefined
            ? payload.publication_slot_id
            : payload?.publication_slot_content_id;

    if (isTitleOrSubtitleFormat && payloadSlotRaw !== undefined) {
        const firstSlot = await getFirstArticleSlotId(String(plainRow.publication_article_id), null);
        if (firstSlot == null) {
            throw httpError(400, "Cannot assign title/subtitle until magazine page 1 exists.");
        }
        if (payloadSlotRaw === null || payloadSlotRaw === "") {
            throw httpError(400, "Title and subtitle must stay on page 1 (cannot unassign).");
        }
        const nextN = Number(payloadSlotRaw);
        if (!Number.isInteger(nextN) || nextN <= 0) {
            throw httpError(400, "publication_slot_id must be page 1 slot.");
        }
        if (nextN !== firstSlot) {
            throw httpError(400, "Title and subtitle must be assigned to page 1 only.");
        }
    }

    let nextFormatIfAny = currentFormat;
    if (payload?.publication_article_chunk_format !== undefined) {
        nextFormatIfAny = String(payload.publication_article_chunk_format);
    }
    const slotIdForDup =
        payloadSlotRaw !== undefined
            ? payloadSlotRaw === null
                ? null
                : Number(payloadSlotRaw)
            : plainRow.publication_slot_id == null
              ? null
              : Number(plainRow.publication_slot_id);

    if (
        payload?.publication_article_chunk_format !== undefined &&
        nextFormatIfAny !== currentFormat &&
        (nextFormatIfAny === "title" || nextFormatIfAny === "subtitle") &&
        Number.isInteger(slotIdForDup)
    ) {
        const dup = await PublicationArticleChunkDbModel.count({
            where: {
                publication_article_id: plainRow.publication_article_id,
                publication_slot_id: slotIdForDup,
                publication_article_chunk_format: nextFormatIfAny,
                publication_article_chunk_id: { [Op.ne]: id },
            },
        });
        if (dup > 0) {
            throw httpError(
                400,
                `This magazine page already has a ${nextFormatIfAny} chunk.`
            );
        }
    }

    const updates = {};
    if (payload?.publication_article_chunk_format !== undefined) {
        const f = String(payload.publication_article_chunk_format);
        if (!PUBLICATION_ARTICLE_CHUNK_FORMATS.includes(f)) {
            throw httpError(400, "Invalid publication_article_chunk_format");
        }
        updates.publication_article_chunk_format = f;
    }
    if (payload?.chunk_html !== undefined) {
        const fmtForHtml =
            updates.publication_article_chunk_format != null
                ? String(updates.publication_article_chunk_format)
                : currentFormat;
        updates.chunk_html = coercePlainTextChunkHtmlForApi(
            String(payload.chunk_html ?? ""),
            fmtForHtml
        );
    }
    if (payload?.chunk_position !== undefined) {
        const n = Number(payload.chunk_position);
        if (!Number.isFinite(n)) throw httpError(400, "chunk_position must be a number");
        updates.chunk_position = n;
    }
    if (payload?.chunk_area_array !== undefined) {
        updates.chunk_area_array = normalizeChunkAreaArray(payload.chunk_area_array);
    }
    if (payload?.chunk_image_caption !== undefined) {
        const fmtForCaption =
            updates.publication_article_chunk_format != null
                ? String(updates.publication_article_chunk_format)
                : currentFormat;
        if (!chunkFormatIncludesImage(fmtForCaption)) {
            throw httpError(400, "chunk_image_caption applies only to image chunks");
        }
        updates.chunk_image_caption = String(payload.chunk_image_caption ?? "");
    }
    if (payloadSlotRaw !== undefined) {
        if (payloadSlotRaw === null) {
            updates.publication_slot_id = null;
        } else {
            const n = Number(payloadSlotRaw);
            if (!Number.isFinite(n)) {
                throw httpError(400, "publication_slot_id must be numeric or null");
            }
            updates.publication_slot_id = n;
        }
    }
    if (Object.keys(updates).length) {
        await row.update(updates);
    }
    await row.reload();

    const reloaded = plain(row);
    const fmtAfter = String(
        reloaded.publication_article_chunk_format ?? currentFormat
    );
    const areasAfter = normalizeChunkAreaArray(reloaded.chunk_area_array);
    const slotAfter =
        reloaded.publication_slot_id != null
            ? Number(reloaded.publication_slot_id)
            : null;
    if (
        fmtAfter === "only_image" &&
        areasAfter.length > 0 &&
        slotAfter != null &&
        Number.isFinite(slotAfter) &&
        (payload?.chunk_area_array !== undefined || payload?.chunk_html !== undefined)
    ) {
        await clearTextChunksForImageAreas({
            publicationArticleId: String(reloaded.publication_article_id),
            slotId: slotAfter,
            imageAreas: areasAfter,
        });
        await row.reload();
    }

    return toApiChunk(row);
}

/**
 * Aligns the regular_page slots attached to a `publication_article` so the
 * length of `publication_slots_id_array` matches `desired_page_count`.
 *
 * - When growing (target > current): creates new `slot_key='regular_page'`
 *   rows in `publication_slots_db` (one per missing page) with `slot_article_id`.
 * - When shrinking (target < current): deletes the *trailing* slots. Only `regular_page` slots that
 *   still belong to this publication and have no project assigned are
 *   removed; if a slot has been re-purposed it is detached from the array
 *   instead of being destroyed (defensive default).
 *
 * Always returns the updated `publication_article` and the resulting
 * publication_slots_id_array.
 */
export async function syncPublicationArticlePages(publicationArticleId, desiredPageCount) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const target = Number(desiredPageCount);
    if (!Number.isInteger(target) || target < 1) {
        throw httpError(400, "desired_page_count must be a positive integer");
    }

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    let payload;
    try {
        payload = await sequelize.transaction(async (transaction) => {
            const mediatecaCleanupTasks = [];
            const article = await PublicationArticleDbModel.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!article) throw httpError(404, "publication_article not found");

            const ap = article.get({ plain: true });
            const currentArray = Array.isArray(ap.publication_slots_id_array)
                ? ap.publication_slots_id_array.map((n) => Number(n)).filter((n) => Number.isFinite(n))
                : [];

            // --- Resolve which existing slot ids actually still exist in the DB.
            const existingSlots = currentArray.length
                ? await PublicationSlotDbModel.findAll({
                      where: { publication_slot_id: { [Op.in]: currentArray } },
                      transaction,
                  })
                : [];
            const existingById = new Map(
                existingSlots.map((s) => [Number(s.get("publication_slot_id")), s])
            );
            const validArray = currentArray.filter((slotId) => existingById.has(Number(slotId)));

            // Read publication_format from publications_db so new slots inherit it.
            let publicationFormat = ARTICLE_PAGE_DEFAULT_FORMAT;
            try {
                const rows = await sequelize.query(
                    `SELECT publication_format
                     FROM public.publications_db
                     WHERE publication_id = :pid`,
                    {
                        replacements: { pid: ap.publication_id },
                        type: QueryTypes.SELECT,
                        transaction,
                    }
                );
                if (rows && rows[0]?.publication_format) {
                    publicationFormat = String(rows[0].publication_format);
                }
            } catch {
                // Keep default format on lookup failure.
            }

            let nextArray = [...validArray];

            if (target > nextArray.length) {
                // Grow: create the missing regular_page slots.
                const missing = target - nextArray.length;
                for (let i = 0; i < missing; i++) {
                    const publication_page = await computeNextRegularPublicationPage(ap.publication_id, {
                        transaction,
                    });
                    await shiftPublicationSlotsForRegularInsert(ap.publication_id, publication_page, {
                        transaction,
                    });
                    const slot_ordinal = publication_page + 1;
                    const slot = await PublicationSlotDbModel.create(
                        {
                            publication_id: ap.publication_id,
                            publication_format: publicationFormat,
                            slot_key: ARTICLE_PAGE_SLOT_KEY,
                            publication_page,
                            slot_ordinal,
                            slot_content_type: "article",
                            slot_state: ARTICLE_PAGE_SLOT_STATE,
                            slot_article_id: ap.article_id,
                        },
                        { transaction }
                    );
                    const slotId = Number(slot.get("publication_slot_id"));
                    nextArray.push(slotId);
                    if (Number.isInteger(slotId) && slotId > 0) {
                        await ensureMagazineSlotTitleSubtitleChunks(id, slotId, {
                            transaction,
                            includeTitleSubtitle: validArray.length === 0 && i === 0,
                        });
                    }
                    const pubRow = await PublicationModel.findByPk(String(ap.publication_id), { transaction });
                    if (pubRow) {
                        try {
                            await ensureArticleSlotMaterialsFolderHierarchy(
                                pubRow,
                                ap.article_id,
                                slotId,
                                { transaction }
                            );
                        } catch (e) {
                            console.warn(
                                "[PublicationArticleService] ensure article slot mediateca folder:",
                                e?.message ?? e
                            );
                        }
                    }
                }
            } else if (target < nextArray.length) {
                // Shrink: drop trailing slots that are still safe to delete.
                while (nextArray.length > target) {
                    const slotId = nextArray.pop();
                    const slot = existingById.get(Number(slotId));
                    if (!slot) continue;
                    const isRegularPage = String(slot.get("slot_key") ?? "").trim().toLowerCase() === ARTICLE_PAGE_SLOT_KEY;
                    const projectId = slot.get("project_id");
                    if (!isRegularPage || projectId) {
                        // Defensive: leave the slot in place, just unlink it from
                        // this article. Surfaces as a warning to the caller via
                        // the returned `unlinked_slot_ids` field.
                        continue;
                    }
                    const ctype = String(slot.get("slot_content_type") ?? "article").toLowerCase();
                    let aid = slot.get("slot_article_id") != null ? String(slot.get("slot_article_id")).trim() : "";
                    if (!aid) aid = String(ap.article_id ?? "").trim();
                    mediatecaCleanupTasks.push({
                        publicationId: String(slot.get("publication_id") ?? ""),
                        slotId: Number(slotId),
                        slotContentType: ctype || "article",
                        slotArticleId: aid,
                    });
                    await PublicationArticleChunkDbModel.update(
                        { publication_slot_id: null },
                        {
                            where: { publication_slot_id: Number(slotId) },
                            transaction,
                        }
                    );
                    await slot.destroy({ transaction });
                }
            }

            await article.update(
                {
                    desired_page_count: target,
                    publication_slots_id_array: nextArray,
                },
                { transaction }
            );

            return {
                publication_article: toApiPublicationArticle(article),
                publication_slots_id_array: nextArray,
                _mediateca_cleanup_tasks: mediatecaCleanupTasks,
            };
        });
        const cleanupTasks = Array.isArray(payload?._mediateca_cleanup_tasks)
            ? payload._mediateca_cleanup_tasks
            : [];
        if (payload && "_mediateca_cleanup_tasks" in payload) {
            delete payload._mediateca_cleanup_tasks;
        }
        for (const task of cleanupTasks) {
            try {
                await deletePublicationSlotMediatecaFolder(task);
            } catch (e) {
                console.warn(
                    "[PublicationArticleService] mediateca cleanup after slot delete:",
                    e?.message ?? e
                );
            }
        }
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
    const slotsArr = payload?.publication_slots_id_array;
    if (Array.isArray(slotsArr) && slotsArr.length === 1) {
        try {
            await assignUnassignedChunksWhenSinglePage(id, null);
        } catch (e) {
            console.warn(
                "[PublicationArticleService] single-page assign after sync-pages:",
                e?.message ?? e
            );
        }
    }
    return payload;
}

/**
 * Removes a *specific*, currently *empty* article page from a publication_article.
 *
 * Unlike {@link syncPublicationArticlePages}, this targets a slot by id (not just
 * the trailing one) and refuses to act when the slot still has chunks attached —
 * which is the safe operation we want to expose to the article builder UI for
 * an "empty page" delete button.
 *
 * On success it:
 *   1. removes `slotId` from `publication_articles.publication_slots_id_array`,
 *   2. decrements `desired_page_count`,
 *   3. destroys the `publication_slots_db` row (only when it is a
 *      `regular_page` with no `project_id` — otherwise it stays in place and is
 *      simply unlinked from the article),
 *   4. deletes the mediateca folder for that slot (S3 + `folders` table),
 *      best-effort outside the transaction.
 *
 * Returns the API-shaped `publication_article` and the new
 * `publication_slots_id_array`, plus the cleanup outcomes for the caller / UI.
 *
 * Refuses (throws 400/404/409) when:
 *   - the slot is not in the article's array,
 *   - the slot still has any `publication_article_chunks` rows attached,
 *   - removing it would leave the article with zero pages.
 */
export async function removeEmptyPublicationArticlePage(
    publicationArticleId,
    slotId,
    options = {}
) {
    const id = String(publicationArticleId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_id is required");
    const sid = Number(slotId);
    if (!Number.isInteger(sid) || sid <= 0) {
        throw httpError(400, "publication_slot_id must be a positive integer");
    }
    const deleteChunks = Boolean(options?.deleteChunks);

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    let mediatecaCleanupTask = null;
    let payload;
    try {
        payload = await sequelize.transaction(async (transaction) => {
            const article = await PublicationArticleDbModel.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!article) throw httpError(404, "publication_article not found");

            const ap = article.get({ plain: true });
            const currentArray = Array.isArray(ap.publication_slots_id_array)
                ? ap.publication_slots_id_array
                      .map((n) => Number(n))
                      .filter((n) => Number.isFinite(n))
                : [];
            const idxInArray = currentArray.findIndex((n) => Number(n) === sid);
            if (idxInArray === -1) {
                throw httpError(
                    404,
                    "publication_slot_id is not part of this publication_article"
                );
            }
            if (currentArray.length <= 1) {
                throw httpError(
                    409,
                    "Cannot remove the last remaining page of an article."
                );
            }

            const chunkCount = await PublicationArticleChunkDbModel.count({
                where: {
                    publication_article_id: id,
                    publication_slot_id: sid,
                },
                transaction,
            });
            let deletedChunkCount = 0;
            if (chunkCount > 0) {
                if (!deleteChunks) {
                    throw httpError(
                        409,
                        `Cannot delete page: it still has ${chunkCount} content chunk(s). Move or delete the content first.`
                    );
                }
                deletedChunkCount = await PublicationArticleChunkDbModel.destroy({
                    where: {
                        publication_article_id: id,
                        publication_slot_id: sid,
                    },
                    transaction,
                });
            }

            const slot = await PublicationSlotDbModel.findByPk(sid, { transaction });
            const slotKey = slot
                ? String(slot.get("slot_key") ?? "").trim().toLowerCase()
                : "";
            const projectId = slot ? slot.get("project_id") : null;
            const isRegularPage = slotKey === ARTICLE_PAGE_SLOT_KEY;
            const safeToDestroySlot = Boolean(slot) && isRegularPage && !projectId;

            const nextArray = currentArray.filter((n) => Number(n) !== sid);
            const nextDesired = Math.max(1, nextArray.length);

            if (safeToDestroySlot && slot) {
                const ctype = String(
                    slot.get("slot_content_type") ?? "article"
                ).toLowerCase();
                let aid =
                    slot.get("slot_article_id") != null
                        ? String(slot.get("slot_article_id")).trim()
                        : "";
                if (!aid) aid = String(ap.article_id ?? "").trim();
                mediatecaCleanupTask = {
                    publicationId: String(slot.get("publication_id") ?? ""),
                    slotId: sid,
                    slotContentType: ctype || "article",
                    slotArticleId: aid,
                };
                await slot.destroy({ transaction });
            }

            await article.update(
                {
                    publication_slots_id_array: nextArray,
                    desired_page_count: nextDesired,
                },
                { transaction }
            );

            return {
                publication_article: toApiPublicationArticle(article),
                publication_slots_id_array: nextArray,
                slot_destroyed: safeToDestroySlot,
                removed_slot_id: sid,
                deleted_chunk_count: deletedChunkCount,
                deleted_page_index: idxInArray + 1,
            };
        });
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }

    if (mediatecaCleanupTask) {
        try {
            const result = await deletePublicationSlotMediatecaFolder(
                mediatecaCleanupTask
            );
            payload.mediateca_folder_deleted = Boolean(result?.deleted);
        } catch (e) {
            console.warn(
                "[PublicationArticleService] mediateca cleanup after page delete:",
                e?.message ?? e
            );
            payload.mediateca_folder_deleted = false;
        }
    } else {
        payload.mediateca_folder_deleted = false;
    }

    try {
        const apRow = payload?.publication_article;
        const publicationId = String(apRow?.publication_id ?? "").trim();
        const networkArticleId = String(apRow?.article_id ?? "").trim();
        const nextPageCount = Array.isArray(payload?.publication_slots_id_array)
            ? payload.publication_slots_id_array.length
            : 0;
        if (publicationId && networkArticleId && nextPageCount >= 0) {
            const pubRow = await PublicationModel.findByPk(publicationId);
            if (pubRow) {
                const deletedPageIndex = Number(payload.deleted_page_index) || 0;
                if (deletedPageIndex > 0) {
                    payload.deleted_screenshot =
                        await deleteArticlePageScreenshot(
                            pubRow,
                            networkArticleId,
                            deletedPageIndex
                        );
                }
                payload.pruned_screenshot_count =
                    await pruneArticleScreenshotsBeyondPageCount(
                        pubRow,
                        networkArticleId,
                        nextPageCount
                    );
            }
        }
    } catch (e) {
        console.warn(
            "[PublicationArticleService] screenshot cleanup after page delete:",
            e?.message ?? e
        );
        payload.deleted_screenshot = false;
        payload.pruned_screenshot_count = 0;
    }

    if (
        Array.isArray(payload?.publication_slots_id_array) &&
        payload.publication_slots_id_array.length === 1
    ) {
        try {
            await assignUnassignedChunksWhenSinglePage(id, null);
        } catch (e) {
            console.warn(
                "[PublicationArticleService] single-page assign after empty page delete:",
                e?.message ?? e
            );
        }
    }

    return payload;
}

/**
 * Assigns one `publication_slot_id` at magazine page index `page_index` (0-based),
 * updating `publication_slots_id_array` without gaps (prefix-fill rule).
 */
export async function assignPublicationArticleSlotPage(
    publicationArticleId,
    pageIndexZeroBased,
    publicationSlotId
) {
    const id = String(publicationArticleId ?? "").trim();
    const idx = Number(pageIndexZeroBased);
    const sid = Number(publicationSlotId);
    if (!id) throw httpError(400, "publication_article_id is required");
    if (!Number.isInteger(idx) || idx < 0) {
        throw httpError(400, "page_index must be a non-negative integer");
    }
    if (!Number.isInteger(sid) || sid <= 0) {
        throw httpError(400, "publication_slot_id must be a positive integer");
    }

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    try {
        const updated = await sequelize.transaction(async (transaction) => {
            const article = await PublicationArticleDbModel.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!article) throw httpError(404, "publication_article not found");
            const ap = article.get({ plain: true });
            const pid = String(ap.publication_id ?? "").trim();
            const count = Number(ap.desired_page_count);
            if (!Number.isInteger(count) || count < 1) {
                throw httpError(400, "Invalid desired_page_count on publication_article row");
            }

            if (idx >= count) {
                throw httpError(
                    400,
                    `page_index must be less than desired_page_count (${count}).`
                );
            }

            if (await publicationArticleSlotClaimedByOtherPublicationArticle(id, pid, sid, transaction)) {
                throw httpError(
                    409,
                    "That slot is already assigned to another publication article in this issue."
                );
            }

            await coerceRegularPageSlotToArticleForPublicationArticle(pid, id, sid, transaction);
            await assertPublicationSlotsBelongToPublicationAndArticleTyped(pid, [sid], transaction);

            let cur = Array.isArray(ap.publication_slots_id_array)
                ? ap.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n))
                : [];

            const dupIdx = cur.findIndex((x, i) => Number(x) === sid && i !== idx);
            if (dupIdx >= 0) {
                throw httpError(
                    400,
                    "Cannot assign the same publication_slot twice for this publication article."
                );
            }

            if (idx < cur.length) {
                cur[idx] = sid;
            } else if (idx === cur.length) {
                cur.push(sid);
            } else {
                throw httpError(
                    400,
                    "Assign earlier magazine pages first (slot list cannot have gaps)."
                );
            }

            await article.update({ publication_slots_id_array: cur }, { transaction });
            await article.reload({ transaction });
            return toApiPublicationArticle(article);
        });
        return updated;
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
}

async function maxEditorialPublicationPageUpperBoundFromEndSlot(publicationId, transaction) {
    const pid = String(publicationId ?? "").trim();
    const endRow = await PublicationSlotDbModel.findOne({
        where: {
            publication_id: pid,
            slot_key: { [Op.in]: ["end", "end_page", "end page"] },
        },
        attributes: ["publication_page"],
        transaction,
    });
    if (!endRow) return null;
    const e = Number(endRow.get("publication_page"));
    return Number.isFinite(e) ? Math.round(e) : null;
}

/**
 * Moves an existing block of `regular_page` + `article` slots to a new consecutive
 * `publication_page` range without creating new slot rows (avoids orphan accumulation
 * when users move the same article back and forth with "Edit slot location").
 *
 * Rows are briefly parked on fractional pages below 10 so {@link shiftPublicationSlotsForRegularInsert}
 * never shifts them while parked.
 */
async function relocatePublicationArticleBlockInPlace(
    publicationId,
    publicationArticleId,
    oldSlotIds,
    startPublicationPage,
    articleRow,
    transaction
) {
    const pid = String(publicationId ?? "").trim();
    const paId = String(publicationArticleId ?? "").trim();
    const startP = Number(startPublicationPage);
    const oldIds = oldSlotIds.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    const N = oldIds.length;
    if (new Set(oldIds).size !== oldIds.length) {
        throw httpError(400, "Duplicate publication_slot_id in publication_slots_id_array.");
    }

    const maxEd = await maxEditorialPublicationPageUpperBoundFromEndSlot(pid, transaction);
    if (maxEd == null) throw httpError(400, "Cannot resolve end slot for this publication.");
    if (!Number.isInteger(startP) || startP < 10 || startP + N - 1 > maxEd) {
        throw httpError(
            400,
            `The ${N}-page block must fit within editorial publication pages 10–${maxEd} (chosen start ${startP}).`
        );
    }

    const targets = oldIds.map((_, i) => startP + i);
    const slotRows = [];
    for (const sid of oldIds) {
        const row = await PublicationSlotDbModel.findOne({
            where: { publication_id: pid, publication_slot_id: sid },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!row) {
            throw httpError(
                400,
                "A publication_slot_id listed on the article no longer exists for this issue."
            );
        }
        const key = String(row.get("slot_key") ?? "").trim().toLowerCase();
        const ctype = String(row.get("slot_content_type") ?? "").trim().toLowerCase();
        if (key !== ARTICLE_PAGE_SLOT_KEY || ctype !== "article") {
            throw httpError(
                400,
                "Relocation only supports existing regular_page + article slots; use Assign slots to repair mixed types."
            );
        }
        if (await publicationArticleSlotClaimedByOtherPublicationArticle(paId, pid, sid, transaction)) {
            throw httpError(
                409,
                "Cannot relocate: one of these slots is assigned to another publication article."
            );
        }
        slotRows.push(row);
    }

    let already = true;
    for (let i = 0; i < N; i++) {
        const cur = Number(slotRows[i].get("publication_page"));
        const curR = Number.isFinite(cur) ? Math.round(cur) : null;
        if (curR !== targets[i]) {
            already = false;
            break;
        }
    }
    if (already) {
        await articleRow.reload({ transaction });
        return {
            publication_article: toApiPublicationArticle(articleRow),
            publication_slots_id_array: oldIds,
        };
    }

    const PARK_BASE = 9.5;
    for (let i = 0; i < N; i++) {
        const pp = PARK_BASE - (i + 1) * 1e-4;
        const ord = pp + 1;
        await slotRows[i].update(
            {
                publication_page: pp,
                slot_ordinal: ord,
            },
            { transaction }
        );
    }

    for (let i = 0; i < N; i++) {
        const target = targets[i];
        const sid = oldIds[i];
        const blockers = await PublicationSlotDbModel.findAll({
            where: {
                publication_id: pid,
                slot_key: ARTICLE_PAGE_SLOT_KEY,
                publication_page: target,
                publication_slot_id: { [Op.notIn]: oldIds },
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (blockers.length > 0) {
            // eslint-disable-next-line no-await-in-loop
            await shiftPublicationSlotsForRegularInsert(pid, target, { transaction });
        }
        const slotRow = await PublicationSlotDbModel.findByPk(sid, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (!slotRow) throw httpError(500, "Lost slot row during relocation.");
        await slotRow.update(
            {
                publication_page: target,
                slot_ordinal: target + 1,
            },
            { transaction }
        );
    }

    await articleRow.reload({ transaction });
    return {
        publication_article: toApiPublicationArticle(articleRow),
        publication_slots_id_array: oldIds,
    };
}

/**
 * When the article already lists exactly `desired_page_count` valid editorial slot ids, those rows are
 * moved in place (same ids, same slot content) instead of provisioning new rows — prevents orphan slot
 * buildup when users repeatedly change "Edit slot location". Otherwise behaviour is unchanged.
 */
export async function provisionPublicationArticleConsecutiveSlots(
    publicationArticleId,
    startPublicationPage
) {
    const id = String(publicationArticleId ?? "").trim();
    const startP = Number(startPublicationPage);
    if (!id) throw httpError(400, "publication_article_id is required");
    if (!Number.isInteger(startP)) {
        throw httpError(400, "start_publication_page must be an integer");
    }

    const sequelize = PublicationArticleDbModel.sequelize;
    if (!sequelize) throw new Error("PublicationArticleDbModel not initialized");

    let payload;
    try {
        payload = await sequelize.transaction(async (transaction) => {
            const article = await PublicationArticleDbModel.findByPk(id, {
                transaction,
                lock: transaction.LOCK.UPDATE,
            });
            if (!article) throw httpError(404, "publication_article not found");
            const ap = article.get({ plain: true });
            const pid = String(ap.publication_id ?? "").trim();
            const N = Number(ap.desired_page_count);
            if (!Number.isInteger(N) || N < 1) {
                throw httpError(400, "Invalid desired_page_count on publication_article row");
            }

            const existingArr = Array.isArray(ap.publication_slots_id_array)
                ? ap.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n) && n > 0)
                : [];

            if (existingArr.length === N) {
                return await relocatePublicationArticleBlockInPlace(
                    pid,
                    id,
                    existingArr,
                    startP,
                    article,
                    transaction
                );
            }

            let publicationFormat = ARTICLE_PAGE_DEFAULT_FORMAT;
            try {
                const rows = await sequelize.query(
                    `SELECT publication_format
                     FROM public.publications_db
                     WHERE publication_id = :pid`,
                    {
                        replacements: { pid },
                        type: QueryTypes.SELECT,
                        transaction,
                    }
                );
                if (rows && rows[0]?.publication_format) {
                    publicationFormat = String(rows[0].publication_format);
                }
            } catch {
                /* keep default */
            }

            const slotIds = [];

            for (let i = 0; i < N; i++) {
                const page = startP + i;
                const candidates = await PublicationSlotDbModel.findAll({
                    where: {
                        publication_id: pid,
                        publication_page: page,
                        slot_key: ARTICLE_PAGE_SLOT_KEY,
                    },
                    transaction,
                    lock: transaction.LOCK.UPDATE,
                });

                let picked = null;
                for (const c of candidates) {
                    const cid = Number(c.get("publication_slot_id"));
                    const ctype = String(c.get("slot_content_type") ?? "").trim().toLowerCase();
                    if (ctype !== "article") continue;
                    // eslint-disable-next-line no-await-in-loop
                    const claimed = await publicationArticleSlotClaimedByOtherPublicationArticle(
                        id,
                        pid,
                        cid,
                        transaction
                    );
                    if (claimed) continue;
                    picked = cid;
                    break;
                }

                if (picked == null) {
                    for (const c of candidates) {
                        const cid = Number(c.get("publication_slot_id"));
                        const ctype = String(c.get("slot_content_type") ?? "").trim().toLowerCase();
                        if (ctype === "article") continue;
                        // eslint-disable-next-line no-await-in-loop
                        const claimed = await publicationArticleSlotClaimedByOtherPublicationArticle(
                            id,
                            pid,
                            cid,
                            transaction
                        );
                        if (claimed) continue;
                        // eslint-disable-next-line no-await-in-loop
                        await coerceRegularPageSlotToArticleForPublicationArticle(
                            pid,
                            id,
                            cid,
                            transaction
                        );
                        picked = cid;
                        break;
                    }
                }

                if (picked != null) {
                    slotIds.push(picked);
                    continue;
                }

                const nonArticleBlocking = candidates.some(
                    (c) =>
                        String(c.get("slot_content_type") ?? "").trim().toLowerCase() !== "article"
                );
                if (nonArticleBlocking) {
                    throw httpError(
                        409,
                        `Magazine page ${page} already has a non-article editorial slot. Pick another starting page or change that slot in Flatplan.`
                    );
                }

                await shiftPublicationSlotsForRegularInsert(pid, page, { transaction });
                const slot_ordinal = page + 1;
                const slot = await PublicationSlotDbModel.create(
                    {
                        publication_id: pid,
                        publication_format: publicationFormat,
                        slot_key: ARTICLE_PAGE_SLOT_KEY,
                        publication_page: page,
                        slot_ordinal,
                        slot_content_type: "article",
                        slot_state: ARTICLE_PAGE_SLOT_STATE,
                        slot_article_id: ap.article_id,
                    },
                    { transaction }
                );
                const slotId = Number(slot.get("publication_slot_id"));
                slotIds.push(slotId);

                if (Number.isInteger(slotId) && slotId > 0) {
                    await ensureMagazineSlotTitleSubtitleChunks(id, slotId, {
                        transaction,
                        includeTitleSubtitle: i === 0,
                    });
                }
                const pubRow = await PublicationModel.findByPk(String(pid), { transaction });
                if (pubRow) {
                    try {
                        await ensureArticleSlotMaterialsFolderHierarchy(
                            pubRow,
                            ap.article_id,
                            slotId,
                            { transaction }
                        );
                    } catch (e) {
                        console.warn(
                            "[PublicationArticleService] ensure article slot mediateca folder (provision):",
                            e?.message ?? e
                        );
                    }
                }
            }

            await article.update({ publication_slots_id_array: slotIds }, { transaction });
            await article.reload({ transaction });
            return {
                publication_article: toApiPublicationArticle(article),
                publication_slots_id_array: slotIds,
            };
        });
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_articles table is not yet provisioned in this database (migration 034 pending)."
            );
        }
        throw error;
    }
    return payload;
}

/**
 * @param {string} chunkId
 * @param {{ deleteMediatecaMedia?: boolean }} [options]
 *   When `deleteMediatecaMedia` is true, referenced mediateca files are removed.
 */
export async function deleteChunk(chunkId, options = {}) {
    const id = String(chunkId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_chunk_id is required");
    let row;
    try {
        row = await PublicationArticleChunkDbModel.findByPk(id);
    } catch (error) {
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_article_chunks table is not yet provisioned in this database (migration 035 pending)."
            );
        }
        throw error;
    }
    if (!row) throw httpError(404, "publication_article_chunk not found");
    const plainBefore = plain(row);
    const fmt = String(plainBefore.publication_article_chunk_format ?? "");
    if (LOCKED_MAGAZINE_CHUNK_FORMATS.has(fmt)) {
        throw httpError(400, "Title and subtitle chunks cannot be deleted.");
    }
    const chunkHtml = String(plainBefore.chunk_html ?? "");
    const slotId =
        plainBefore.publication_slot_id != null
            ? Number(plainBefore.publication_slot_id)
            : null;
    const isGridOverlayImage =
        fmt === "only_image" &&
        (normalizeChunkAreaArray(plainBefore.chunk_area_array).length > 0 ||
            /data-pmc-overlay=/i.test(chunkHtml));
    const publicationArticleId = String(plainBefore.publication_article_id ?? "");
    try {
        const deleted = await PublicationArticleChunkDbModel.destroy({
            where: { publication_article_chunk_id: id },
        });
        if (!deleted) throw httpError(404, "publication_article_chunk not found");
    } catch (error) {
        if (error?.statusCode) throw error;
        if (isMissingContentsManagerTable(error)) {
            throw httpError(
                503,
                "publication_article_chunks table is not yet provisioned in this database (migration 035 pending)."
            );
        }
        throw error;
    }
    const deleteMediateca = options?.deleteMediatecaMedia === true;
    const deletedMediaIds = deleteMediateca
        ? await tryDeleteChunkMediaByHtml(chunkHtml)
        : [];

    if (
        isGridOverlayImage &&
        publicationArticleId &&
        slotId != null &&
        Number.isFinite(slotId)
    ) {
        await collapseTextChunksAfterImageRemoval({
            publicationArticleId,
            slotId,
        });
    }

    return {
        ok: true,
        publication_article_chunk_id: id,
        deleted_media_ids: deletedMediaIds,
    };
}
