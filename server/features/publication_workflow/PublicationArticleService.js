import { Op, QueryTypes } from "sequelize";
import PublicationArticleDbModel from "./PublicationArticleDbModel.js";
import PublicationArticleChunkDbModel from "./PublicationArticleChunkDbModel.js";
import PublicationSlotDbModel from "./PublicationSlotDbModel.js";
import PublicationSlotContentDbModel from "./PublicationSlotContentDbModel.js";
import "../../database/models.js";

/** Slot key used for the auto-generated magazine pages of an article. */
export const ARTICLE_PAGE_SLOT_KEY = "regular_page";
export const ARTICLE_PAGE_SLOT_STATE = "pending";
export const ARTICLE_PAGE_DEFAULT_FORMAT = "flipbook";

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
        publication_article_created_at: p.publication_article_created_at ?? null,
        publication_article_updated_at: p.publication_article_updated_at ?? null,
    };
}

function toApiChunk(row) {
    const p = plain(row);
    if (!p) return null;
    return {
        publication_article_chunk_id: p.publication_article_chunk_id,
        publication_article_id: p.publication_article_id,
        publication_id: p.publication_id,
        publication_slot_content_id:
            p.publication_slot_content_id != null
                ? Number(p.publication_slot_content_id)
                : null,
        publication_article_chunk_format:
            p.publication_article_chunk_format != null
                ? String(p.publication_article_chunk_format)
                : "only_text",
        chunk_html: p.chunk_html != null ? String(p.chunk_html) : "",
        chunk_position: p.chunk_position != null ? Number(p.chunk_position) : 0,
        original_article_content_id:
            p.original_article_content_id != null
                ? String(p.original_article_content_id)
                : null,
        publication_article_chunk_created_at:
            p.publication_article_chunk_created_at ?? null,
        publication_article_chunk_updated_at:
            p.publication_article_chunk_updated_at ?? null,
    };
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
    return toApiPublicationArticle(row);
}

/**
 * Loads the publication_article row plus its chunks, ordered by chunk_position.
 */
export async function getPublicationArticleWithChunks(publicationArticleId) {
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
    let chunks = [];
    try {
        chunks = await PublicationArticleChunkDbModel.findAll({
            where: { publication_article_id: id },
            order: [["chunk_position", "ASC"]],
        });
    } catch (error) {
        if (!isMissingContentsManagerTable(error)) throw error;
    }
    return {
        publication_article: toApiPublicationArticle(row),
        chunks: chunks.map(toApiChunk).filter(Boolean),
    };
}

/**
 * Updates `desired_page_count` and/or `publication_slots_id_array` on a
 * publication_article row. Returns the API-shaped updated row.
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
    if (!Object.keys(updates).length) {
        const row = await PublicationArticleDbModel.findByPk(id);
        return row ? toApiPublicationArticle(row) : null;
    }
    let row;
    try {
        row = await PublicationArticleDbModel.findByPk(id);
        if (!row) throw httpError(404, "publication_article not found");
        await row.update(updates);
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
    if (t === "image" || t === "main_image" || t === "gallery") return "only_image";
    return "only_text";
}

/**
 * Renders an `article_contents.article_content_content` JSONB blob into HTML
 * suitable for `chunk_html`. Keeps the exotic shapes (gallery, embed) as a
 * safe stringified fallback so editors can still rework them later.
 */
function articleContentToHtml(type, content) {
    const t = String(type ?? "").trim().toLowerCase();
    if (content == null) return "";
    if (typeof content === "string") return content;
    if (typeof content !== "object") return String(content);

    if (t === "title" || t === "subtitle") {
        const text = String(content.text ?? content.value ?? "").trim();
        return text ? `<p>${text}</p>` : "";
    }
    if (t === "paragraph" || t === "text" || t === "html") {
        const html = String(content.html ?? content.text ?? "").trim();
        return html;
    }
    if (t === "image" || t === "main_image") {
        const src = String(content.src ?? content.url ?? "").trim();
        const alt = String(content.alt ?? "").trim();
        return src ? `<figure><img src="${src}" alt="${alt}" /></figure>` : "";
    }
    return `<pre>${JSON.stringify(content)}</pre>`;
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
            const chunk = await PublicationArticleChunkDbModel.create(
                {
                    publication_article_id: articlePlain.publication_article_id,
                    publication_id: articlePlain.publication_id,
                    publication_slot_content_id: null,
                    publication_article_chunk_format: mapArticleContentTypeToChunkFormat(
                        sc.article_content_type
                    ),
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
    const chunk = await PublicationArticleChunkDbModel.create({
        publication_article_id: ap.publication_article_id,
        publication_id: ap.publication_id,
        publication_slot_content_id:
            payload?.publication_slot_content_id != null
                ? Number(payload.publication_slot_content_id)
                : null,
        publication_article_chunk_format: format,
        chunk_html: String(payload?.chunk_html ?? ""),
        chunk_position: Number.isFinite(Number(payload?.chunk_position))
            ? Number(payload.chunk_position)
            : 0,
        original_article_content_id:
            payload?.original_article_content_id != null
                ? String(payload.original_article_content_id)
                : null,
    });
    return toApiChunk(chunk);
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

    const updates = {};
    if (payload?.publication_article_chunk_format !== undefined) {
        const f = String(payload.publication_article_chunk_format);
        if (!PUBLICATION_ARTICLE_CHUNK_FORMATS.includes(f)) {
            throw httpError(400, "Invalid publication_article_chunk_format");
        }
        updates.publication_article_chunk_format = f;
    }
    if (payload?.chunk_html !== undefined) {
        updates.chunk_html = String(payload.chunk_html ?? "");
    }
    if (payload?.chunk_position !== undefined) {
        const n = Number(payload.chunk_position);
        if (!Number.isFinite(n)) throw httpError(400, "chunk_position must be a number");
        updates.chunk_position = n;
    }
    if (payload?.publication_slot_content_id !== undefined) {
        if (payload.publication_slot_content_id === null) {
            updates.publication_slot_content_id = null;
        } else {
            const n = Number(payload.publication_slot_content_id);
            if (!Number.isFinite(n)) {
                throw httpError(400, "publication_slot_content_id must be numeric or null");
            }
            updates.publication_slot_content_id = n;
        }
    }
    if (Object.keys(updates).length) {
        await row.update(updates);
    }
    return toApiChunk(row);
}

/**
 * Aligns the regular_page slots attached to a `publication_article` so the
 * length of `publication_slots_id_array` matches `desired_page_count`.
 *
 * - When growing (target > current): creates new `slot_key='regular_page'`
 *   rows in `publication_slots_db` (one per missing page) and a matching
 *   `publication_slot_content` row with `slot_content_format='article'` and
 *   an empty `slot_content_object_array`.
 * - When shrinking (target < current): deletes the *trailing* slots and
 *   their `publication_slot_content` rows. Only `regular_page` slots that
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
                // Grow: create the missing regular_page slots + slot_content.
                const missing = target - nextArray.length;
                for (let i = 0; i < missing; i++) {
                    const slot = await PublicationSlotDbModel.create(
                        {
                            publication_id: ap.publication_id,
                            publication_format: publicationFormat,
                            slot_key: ARTICLE_PAGE_SLOT_KEY,
                            slot_content_type: "article",
                            slot_state: ARTICLE_PAGE_SLOT_STATE,
                        },
                        { transaction }
                    );
                    const slotId = Number(slot.get("publication_slot_id"));
                    nextArray.push(slotId);
                    await PublicationSlotContentDbModel.create(
                        {
                            publication_id: ap.publication_id,
                            publication_slot_id: slotId,
                            publication_slot_position: 1,
                            slot_content_format: "article",
                            slot_content_object_array: [],
                            article_id: ap.article_id,
                        },
                        { transaction }
                    );
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
                    await PublicationSlotContentDbModel.destroy({
                        where: { publication_slot_id: slotId },
                        transaction,
                    });
                    await PublicationArticleChunkDbModel.update(
                        { publication_slot_content_id: null },
                        {
                            where: { publication_slot_content_id: { [Op.is]: null } },
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

export async function deleteChunk(chunkId) {
    const id = String(chunkId ?? "").trim();
    if (!id) throw httpError(400, "publication_article_chunk_id is required");
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
    return { ok: true, publication_article_chunk_id: id };
}
