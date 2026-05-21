"use client";

import {
  chunkSupportsTextEditing,
  writeChunkEditableHtml,
} from "./articleChunkPlainTextEditing";
import { normalizeChunkFormat } from "./magazineArticleColumnFlow";
import type { PublicationArticleChunk } from "./article_builder_page/types";

function isEditableTextChunk(chunk: PublicationArticleChunk): boolean {
  const fmt = normalizeChunkFormat(chunk.publication_article_chunk_format);
  return (
    (fmt === "only_text" || fmt === "text_image" || fmt === "image_text") &&
    chunkSupportsTextEditing(fmt)
  );
}

/**
 * Reads live `contentEditable` cells from visible editor previews only (not the
 * off-screen flatplan capture stage).
 */
export function collectVisibleEditorHtmlOverrides(): Map<string, string> {
  const updates = new Map<string, string>();
  const previews = document.querySelectorAll("[data-article-editor-preview]");

  for (const preview of previews) {
    const editors = preview.querySelectorAll<HTMLDivElement>(
      "[data-pmc-chunk-rich-editor]"
    );
    for (const el of editors) {
      const chunkId = el.getAttribute("data-pmc-chunk-rich-editor");
      if (!chunkId) continue;
      updates.set(chunkId, el.innerHTML);
    }
  }

  return updates;
}

/**
 * Full save plan: React chunk state plus DOM overrides for visible editors.
 */
export function buildChunkHtmlSavePlan(
  chunks: PublicationArticleChunk[],
  domInnerHtmlByChunkId: Map<string, string>
): Map<string, string> {
  const plan = new Map<string, string>();

  for (const chunk of chunks) {
    if (!isEditableTextChunk(chunk)) continue;
    const chunkId = chunk.publication_article_chunk_id;
    const format = String(chunk.publication_article_chunk_format ?? "");
    const previous = String(chunk.chunk_html ?? "");
    const innerFromDom = domInnerHtmlByChunkId.get(chunkId);

    const html =
      innerFromDom != null
        ? writeChunkEditableHtml(previous, format, innerFromDom)
        : previous;

    plan.set(chunkId, html);
  }

  return plan;
}

export type ReconcileChunksResult = {
  deleted: number;
  positions_updated: number;
};

/**
 * Server-side save reconciliation: for each slot+grid area keep the chunk with the
 * latest `updated_at`, delete older duplicates, then renumber `chunk_position`
 * to match the current page layout (title, subtitle, images, grid cells).
 */
export async function reconcilePublicationArticleChunksOnSave(
  publicationArticleId: string,
  options?: { preferKeepChunkIds?: string[] }
): Promise<ReconcileChunksResult> {
  const res = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks/reconcile`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        prefer_keep_chunk_ids: options?.preferKeepChunkIds ?? [],
      }),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    let message = txt || "Failed to reconcile publication article chunks";
    try {
      const parsed = JSON.parse(txt) as { message?: string };
      if (parsed?.message) message = parsed.message;
    } catch {
      /* raw text */
    }
    throw new Error(message);
  }
  const data = (await res.json()) as ReconcileChunksResult;
  return {
    deleted: Number(data.deleted) || 0,
    positions_updated: Number(data.positions_updated) || 0,
  };
}
