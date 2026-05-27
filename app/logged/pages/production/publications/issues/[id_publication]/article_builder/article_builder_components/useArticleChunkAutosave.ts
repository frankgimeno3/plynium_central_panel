"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PublicationArticleChunk } from "./article_builder_page/types";

async function patchChunkHtml(
  chunkId: string,
  chunkHtml: string,
  options?: { keepalive?: boolean }
): Promise<PublicationArticleChunk> {
  const res = await fetch(
    `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
      keepalive: Boolean(options?.keepalive),
      body: JSON.stringify({ chunk_html: chunkHtml }),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to update chunk");
  }
  return (await res.json()) as PublicationArticleChunk;
}

/**
 * Per-chunk autosave for `publication_article_chunks.chunk_html`.
 *
 * - `scheduleChunkHtmlChange`: optimistic local update + debounced PATCH.
 * - `commitChunkHtmlNow`: immediate PATCH (blur, overflow spill, page hide).
 * - `flushAllPendingChunkHtml`: persists every debounced edit still in the queue.
 */
export function useArticleChunkAutosave(options: {
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
  debounceMs?: number;
}) {
  const { setChunks, onSaveMessage, onSaveError, debounceMs = 250 } = options;
  const [savingChunkIds, setSavingChunkIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );
  const pendingHtmlRef = useRef<Map<string, string>>(new Map());

  const persistChunkHtml = useCallback(
    async (chunkId: string, html: string, opts?: { keepalive?: boolean }) => {
      setSavingChunkIds((prev) => {
        const next = new Set(prev);
        next.add(chunkId);
        return next;
      });
      try {
        const updated = await patchChunkHtml(chunkId, html, opts);
        const savedHtml = updated.chunk_html ?? html;
        const pendingNow = pendingHtmlRef.current.get(chunkId);
        if (pendingNow != null && pendingNow !== savedHtml) {
          // User kept typing after this PATCH was sent; do not overwrite React/DOM.
          return;
        }
        setChunks((prev) =>
          prev.map((c) =>
            c.publication_article_chunk_id === chunkId
              ? { ...c, chunk_html: savedHtml }
              : c
          )
        );
        pendingHtmlRef.current.delete(chunkId);
        onSaveMessage?.("Chunk saved.");
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to save chunk");
        throw e;
      } finally {
        setSavingChunkIds((prev) => {
          const next = new Set(prev);
          next.delete(chunkId);
          return next;
        });
      }
    },
    [setChunks, onSaveMessage, onSaveError]
  );

  const cancelPendingTimer = useCallback((chunkId: string) => {
    const existing = timersRef.current.get(chunkId);
    if (existing) {
      clearTimeout(existing);
      timersRef.current.delete(chunkId);
    }
  }, []);

  const scheduleChunkHtmlChange = useCallback(
    (chunkId: string, html: string) => {
      pendingHtmlRef.current.set(chunkId, html);
      setChunks((prev) =>
        prev.map((c) =>
          c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: html } : c
        )
      );
      cancelPendingTimer(chunkId);
      const handle = setTimeout(() => {
        timersRef.current.delete(chunkId);
        const latest = pendingHtmlRef.current.get(chunkId);
        if (latest == null) return;
        void persistChunkHtml(chunkId, latest);
      }, debounceMs);
      timersRef.current.set(chunkId, handle);
    },
    [cancelPendingTimer, persistChunkHtml, setChunks, debounceMs]
  );

  const commitChunkHtmlNow = useCallback(
    async (chunkId: string, html: string, opts?: { keepalive?: boolean }) => {
      pendingHtmlRef.current.set(chunkId, html);
      setChunks((prev) =>
        prev.map((c) =>
          c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: html } : c
        )
      );
      cancelPendingTimer(chunkId);
      await persistChunkHtml(chunkId, html, opts);
    },
    [cancelPendingTimer, persistChunkHtml, setChunks]
  );

  const flushAllPendingChunkHtml = useCallback(
    async (opts?: { keepalive?: boolean }) => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();

      const entries = [...pendingHtmlRef.current.entries()];
      for (const [chunkId, html] of entries) {
        try {
          await persistChunkHtml(chunkId, html, opts);
        } catch {
          /* keep flushing other chunks */
        }
      }
    },
    [persistChunkHtml]
  );

  const applyPendingHtmlToChunks = useCallback(
    (chunks: PublicationArticleChunk[]): PublicationArticleChunk[] => {
      const pending = pendingHtmlRef.current;
      if (!pending.size) return chunks;
      return chunks.map((c) => {
        const html = pending.get(c.publication_article_chunk_id);
        return html != null ? { ...c, chunk_html: html } : c;
      });
    },
    []
  );

  useEffect(() => {
    const flushOnHide = () => {
      void flushAllPendingChunkHtml({ keepalive: true });
    };
    window.addEventListener("pagehide", flushOnHide);
    window.addEventListener("beforeunload", flushOnHide);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushAllPendingChunkHtml({ keepalive: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushOnHide);
      window.removeEventListener("beforeunload", flushOnHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flushAllPendingChunkHtml]);

  useEffect(
    () => () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();

      const entries = [...pendingHtmlRef.current.entries()];
      for (const [chunkId, html] of entries) {
        void patchChunkHtml(chunkId, html, { keepalive: true }).catch(() => {
          /* best-effort on unmount */
        });
      }
      pendingHtmlRef.current.clear();
    },
    []
  );

  const persistChunkHtmlBatch = useCallback(
    async (entries: Map<string, string>) => {
      if (!entries.size) return { saved: 0, failures: [] as string[] };

      const failures: string[] = [];
      const results = await Promise.all(
        [...entries.entries()].map(async ([chunkId, html]) => {
          try {
            const updated = await patchChunkHtml(chunkId, html);
            return { chunkId, updated, error: null as string | null };
          } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Failed to update chunk";
            failures.push(`${chunkId}: ${msg}`);
            return { chunkId, updated: null, error: msg };
          }
        })
      );

      const okById = new Map<string, PublicationArticleChunk>();
      for (const row of results) {
        if (row.updated) okById.set(row.chunkId, row.updated);
      }

      if (okById.size) {
        setChunks((prev) =>
          prev.map((c) => {
            const updated = okById.get(c.publication_article_chunk_id);
            if (!updated) return c;
            const savedHtml = updated.chunk_html ?? c.chunk_html;
            const pendingNow = pendingHtmlRef.current.get(c.publication_article_chunk_id);
            if (pendingNow != null && pendingNow !== savedHtml) {
              return c;
            }
            pendingHtmlRef.current.delete(c.publication_article_chunk_id);
            return { ...c, chunk_html: savedHtml };
          })
        );
      }

      if (failures.length) {
        onSaveError?.(
          failures.length === entries.size
            ? "Failed to save article chunks"
            : `Some chunks failed to save (${failures.length}/${entries.size})`
        );
      } else if (okById.size) {
        onSaveMessage?.(`${okById.size} chunk(s) saved.`);
      }

      return { saved: okById.size, failures };
    },
    [onSaveError, onSaveMessage, setChunks]
  );

  return {
    scheduleChunkHtmlChange,
    commitChunkHtmlNow,
    saveChunkHtmlNow: commitChunkHtmlNow,
    flushAllPendingChunkHtml,
    applyPendingHtmlToChunks,
    persistChunkHtmlBatch,
    savingChunkIds,
  };
}
