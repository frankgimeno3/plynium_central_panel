import PublicationArticleChunkDbModel from "./PublicationArticleChunkDbModel.js";
import {
    areaArraysOverlap,
    areaCodeToCell,
    cellToAreaCode,
    columnAreaCodes,
    normalizeChunkAreaArray,
    nextFreeAreaInColumn,
} from "./chunkAreaCodes.js";

const TEXT_FORMATS = new Set(["only_text", "text_image", "image_text"]);

function isTextFormat(format) {
    return TEXT_FORMATS.has(String(format ?? "").toLowerCase());
}

function isImageFormat(format) {
    return String(format ?? "").toLowerCase() === "only_image";
}

/**
 * Collect every area code already claimed by image chunks on this page.
 * @param {Array<{ publication_article_chunk_format: string, chunk_area_array: unknown }>} chunks
 */
export function occupiedImageAreas(chunks) {
    const occupied = new Set();
    for (const c of chunks) {
        if (!isImageFormat(c.publication_article_chunk_format)) continue;
        for (const code of normalizeChunkAreaArray(c.chunk_area_array)) {
            occupied.add(code);
        }
    }
    return occupied;
}

/**
 * Default area for a text chunk that has none yet: first free cell in its column,
 * derived from chunk_position among body text chunks in the slot.
 */
function inferTextChunkArea(chunk, textChunksInOrder, columnCount) {
    const existing = normalizeChunkAreaArray(chunk.chunk_area_array);
    if (existing.length) return existing;

    const idx = textChunksInOrder.findIndex(
        (c) => c.publication_article_chunk_id === chunk.publication_article_chunk_id
    );
    const col = idx >= 0 ? idx % columnCount : 0;
    const row = idx >= 0 ? Math.floor(idx / columnCount) : 0;
    const code = cellToAreaCode(col, row);
    return code ? [code] : [];
}

/**
 * After an image chunk claims `imageAreas`, move any overlapping text chunks
 * downward within their column (skipping rows held by images) and bump
 * `chunk_position` so flow order stays consistent.
 *
 * @param {object} params
 * @param {string} params.publicationArticleId
 * @param {number} params.slotId
 * @param {string[]} params.imageAreas area codes for the new/updated image
 * @param {string|null} params.excludeChunkId image chunk being written (omit from occupied set)
 * @param {import("sequelize").Transaction|null} [params.transaction]
 * @returns {Promise<Array<{ chunkId: string, chunk_position: number, chunk_area_array: string[] }>>}
 */
export async function displaceTextChunksForImageAreas({
    publicationArticleId,
    slotId,
    imageAreas,
    excludeChunkId = null,
    transaction = null,
}) {
    const claimed = new Set(normalizeChunkAreaArray(imageAreas));
    if (!claimed.size) return [];

    const rows = await PublicationArticleChunkDbModel.findAll({
        where: {
            publication_article_id: String(publicationArticleId),
            publication_slot_id: Number(slotId),
        },
        order: [
            ["chunk_position", "ASC"],
            ["publication_article_chunk_id", "ASC"],
        ],
        transaction: transaction ?? undefined,
    });

    const plain = rows.map((r) => r.get({ plain: true }));
    const columnCount =
        plain.filter((c) => isTextFormat(c.publication_article_chunk_format)).length >= 3
            ? 3
            : 2;

    const textChunks = plain
        .filter((c) => isTextFormat(c.publication_article_chunk_format))
        .sort((a, b) => a.chunk_position - b.chunk_position || 0);

    const imageOccupied = occupiedImageAreas(plain);
    for (const code of claimed) imageOccupied.add(code);
    if (excludeChunkId) {
        const self = plain.find((c) => c.publication_article_chunk_id === excludeChunkId);
        if (self && isImageFormat(self.publication_article_chunk_format)) {
            for (const code of normalizeChunkAreaArray(self.chunk_area_array)) {
                imageOccupied.delete(code);
            }
        }
    }

    const updates = [];
    let maxPosition = plain.reduce(
        (acc, c) => Math.max(acc, Number(c.chunk_position) || 0),
        -1
    );

    for (const chunk of textChunks) {
        let areas = inferTextChunkArea(chunk, textChunks, columnCount);
        if (!areaArraysOverlap(areas, [...claimed])) continue;

        const first = areaCodeToCell(areas[0]);
        if (!first) continue;

        let targetRow = first.row + 1;
        let targetCode = null;
        while (targetRow < 4) {
            const candidate = cellToAreaCode(first.col, targetRow);
            if (candidate && !imageOccupied.has(candidate)) {
                targetCode = candidate;
                break;
            }
            targetRow += 1;
        }

        if (!targetCode) {
            targetCode = nextFreeAreaInColumn(first.col, 0, imageOccupied, columnCount);
        }
        if (!targetCode) continue;

        const newAreas = [targetCode];
        imageOccupied.add(targetCode);

        maxPosition += 1;
        const newPosition = maxPosition;

        await PublicationArticleChunkDbModel.update(
            {
                chunk_area_array: newAreas,
                chunk_position: newPosition,
            },
            {
                where: { publication_article_chunk_id: chunk.publication_article_chunk_id },
                transaction: transaction ?? undefined,
            }
        );

        updates.push({
            chunkId: chunk.publication_article_chunk_id,
            chunk_position: newPosition,
            chunk_area_array: newAreas,
        });

        const idx = textChunks.findIndex(
            (c) => c.publication_article_chunk_id === chunk.publication_article_chunk_id
        );
        if (idx >= 0) {
            textChunks[idx] = {
                ...textChunks[idx],
                chunk_area_array: newAreas,
                chunk_position: newPosition,
            };
        }
    }

    return updates;
}

/**
 * Assign top-of-column areas [a1,b1,c1] or [a1,b1] for new empty text chunks.
 * @param {number} columnIndex 0-based
 * @param {number} columnCount
 */
export function defaultTextChunkAreaForColumn(columnIndex, columnCount = 3) {
    const code = cellToAreaCode(columnIndex, 0);
    return code ? [code] : [];
}

function rowFromAreaCodes(areas) {
    const cell = areaCodeToCell(normalizeChunkAreaArray(areas)[0] ?? "");
    return cell?.row ?? 0;
}

function columnFromChunk(chunk, textChunksInOrder, columnCount) {
    const areas = normalizeChunkAreaArray(chunk.chunk_area_array);
    if (areas.length) {
        const cell = areaCodeToCell(areas[0]);
        if (cell) return cell.col;
    }
    const idx = textChunksInOrder.findIndex(
        (c) => c.publication_article_chunk_id === chunk.publication_article_chunk_id
    );
    return idx >= 0 ? idx % columnCount : 0;
}

/**
 * After an overlay image chunk is removed, pack text chunks upward in each
 * column — the inverse of `displaceTextChunksForImageAreas`. Rows blocked by
 * remaining images are skipped so text only fills genuinely free cells.
 *
 * @param {object} params
 * @param {string} params.publicationArticleId
 * @param {number} params.slotId
 * @param {number} [params.columnCount] 2 or 3; inferred when omitted
 * @param {import("sequelize").Transaction|null} [params.transaction]
 */
export async function collapseTextChunksAfterImageRemoval({
    publicationArticleId,
    slotId,
    columnCount: columnCountIn = null,
    transaction = null,
}) {
    const rows = await PublicationArticleChunkDbModel.findAll({
        where: {
            publication_article_id: String(publicationArticleId),
            publication_slot_id: Number(slotId),
        },
        order: [
            ["chunk_position", "ASC"],
            ["publication_article_chunk_id", "ASC"],
        ],
        transaction: transaction ?? undefined,
    });

    const plain = rows.map((r) => r.get({ plain: true }));
    const textChunks = plain
        .filter((c) => isTextFormat(c.publication_article_chunk_format))
        .sort((a, b) => a.chunk_position - b.chunk_position || 0);

    const columnCount =
        columnCountIn === 2 || columnCountIn === 3
            ? columnCountIn
            : textChunks.length >= 3
              ? 3
              : 2;

    const imageOccupied = occupiedImageAreas(plain);
    const updates = [];

    /** @type {Map<number, typeof textChunks>} */
    const byCol = new Map();
    for (const chunk of textChunks) {
        const col = columnFromChunk(chunk, textChunks, columnCount);
        if (!byCol.has(col)) byCol.set(col, []);
        byCol.get(col).push(chunk);
    }

    for (const [col, colChunks] of byCol) {
        colChunks.sort(
            (a, b) =>
                rowFromAreaCodes(a.chunk_area_array) -
                rowFromAreaCodes(b.chunk_area_array)
        );
        let nextRow = 0;
        for (const chunk of colChunks) {
            let targetCode = null;
            while (nextRow < 4) {
                const candidate = cellToAreaCode(col, nextRow);
                if (candidate && !imageOccupied.has(candidate)) {
                    targetCode = candidate;
                    nextRow += 1;
                    break;
                }
                nextRow += 1;
            }
            if (!targetCode) continue;

            const prevAreas = normalizeChunkAreaArray(chunk.chunk_area_array);
            const changed =
                prevAreas.length !== 1 || prevAreas[0] !== targetCode;

            if (changed) {
                await PublicationArticleChunkDbModel.update(
                    { chunk_area_array: [targetCode] },
                    {
                        where: {
                            publication_article_chunk_id:
                                chunk.publication_article_chunk_id,
                        },
                        transaction: transaction ?? undefined,
                    }
                );
                chunk.chunk_area_array = [targetCode];
                updates.push({
                    chunkId: chunk.publication_article_chunk_id,
                    chunk_area_array: [targetCode],
                });
            }
        }
    }

    if (updates.length === 0) return updates;

    const reflowed = [...textChunks].sort((a, b) => {
        const ca = columnFromChunk(a, textChunks, columnCount);
        const cb = columnFromChunk(b, textChunks, columnCount);
        if (ca !== cb) return ca - cb;
        return rowFromAreaCodes(a.chunk_area_array) - rowFromAreaCodes(b.chunk_area_array);
    });

    const basePosition = textChunks.reduce(
        (acc, c) => Math.min(acc, Number(c.chunk_position) || 0),
        Number.MAX_SAFE_INTEGER
    );
    let pos =
        Number.isFinite(basePosition) && basePosition < Number.MAX_SAFE_INTEGER
            ? basePosition
            : 0;

    for (const chunk of reflowed) {
        if (Number(chunk.chunk_position) !== pos) {
            await PublicationArticleChunkDbModel.update(
                { chunk_position: pos },
                {
                    where: {
                        publication_article_chunk_id:
                            chunk.publication_article_chunk_id,
                    },
                    transaction: transaction ?? undefined,
                }
            );
            updates.push({
                chunkId: chunk.publication_article_chunk_id,
                chunk_position: pos,
            });
        }
        pos += 1;
    }

    return updates;
}

export { columnAreaCodes, normalizeChunkAreaArray };
