"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import type { PublicationArticleChunk } from "./article_builder_page/types";

async function patchChunkHtml(
  chunkId: string,
  chunkHtml: string
): Promise<PublicationArticleChunk> {
  const res = await fetch(
    `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      credentials: "include",
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
 *   Use this from text-input changes for real-time editing.
 * - `saveChunkHtmlNow`: optimistic update + immediate PATCH (no debounce).
 *   Use this for discrete confirmations like a mediateca image pick.
 */
export function useArticleChunkAutosave(options: {
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
  debounceMs?: number;
}) {
  const { setChunks, onSaveMessage, onSaveError, debounceMs = 600 } = options;
  const [savingChunkIds, setSavingChunkIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(
    () => () => {
      for (const t of timersRef.current.values()) clearTimeout(t);
      timersRef.current.clear();
    },
    []
  );

  const persistChunkHtml = useCallback(
    async (chunkId: string, html: string) => {
      setSavingChunkIds((prev) => {
        const next = new Set(prev);
        next.add(chunkId);
        return next;
      });
      try {
        const updated = await patchChunkHtml(chunkId, html);
        setChunks((prev) =>
          prev.map((c) =>
            c.publication_article_chunk_id === chunkId ? { ...c, ...updated } : c
          )
        );
        onSaveMessage?.("Chunk saved.");
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to save chunk");
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

  const scheduleChunkHtmlChange = useCallback(
    (chunkId: string, html: string) => {
      setChunks((prev) =>
        prev.map((c) =>
          c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: html } : c
        )
      );
      const timers = timersRef.current;
      const existing = timers.get(chunkId);
      if (existing) clearTimeout(existing);
      const handle = setTimeout(() => {
        timers.delete(chunkId);
        void persistChunkHtml(chunkId, html);
      }, debounceMs);
      timers.set(chunkId, handle);
    },
    [persistChunkHtml, setChunks, debounceMs]
  );

  const saveChunkHtmlNow = useCallback(
    async (chunkId: string, html: string) => {
      setChunks((prev) =>
        prev.map((c) =>
          c.publication_article_chunk_id === chunkId ? { ...c, chunk_html: html } : c
        )
      );
      const timers = timersRef.current;
      const existing = timers.get(chunkId);
      if (existing) {
        clearTimeout(existing);
        timers.delete(chunkId);
      }
      await persistChunkHtml(chunkId, html);
    },
    [persistChunkHtml, setChunks]
  );

  return { scheduleChunkHtmlChange, saveChunkHtmlNow, savingChunkIds };
}
