"use client";

import { useCallback, useState } from "react";

import type { PublicationArticleChunk } from "../types";

export function useChunkSelection({
  setChunks,
  onSaveMessage,
  onSaveError,
}: {
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
}) {
  const [chunkSelectionActive, setChunkSelectionActive] = useState(false);
  const [selectedChunkIds, setSelectedChunkIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const [deletingChunks, setDeletingChunks] = useState(false);

  const enterChunkSelectionMode = useCallback(() => {
    setChunkSelectionActive(true);
    setSelectedChunkIds(new Set());
  }, []);

  const exitChunkSelectionMode = useCallback(() => {
    setChunkSelectionActive(false);
    setSelectedChunkIds(new Set());
  }, []);

  const toggleChunkSelection = useCallback((chunkId: string) => {
    setSelectedChunkIds((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) next.delete(chunkId);
      else next.add(chunkId);
      return next;
    });
  }, []);

  const confirmDeleteSelectedChunks = useCallback(async () => {
    if (deletingChunks) return;
    if (selectedChunkIds.size === 0) return;
    setDeletingChunks(true);
    try {
      const idsToDelete = Array.from(selectedChunkIds);
      const failed: string[] = [];

      for (const chunkId of idsToDelete) {
        try {
          const res = await fetch(
            `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}?delete_mediateca=true`,
            { method: "DELETE", credentials: "include" }
          );
          if (!res.ok) {
            failed.push(chunkId);
            continue;
          }
        } catch {
          failed.push(chunkId);
        }
      }

      const succeeded = new Set(idsToDelete.filter((id) => !failed.includes(id)));
      if (succeeded.size > 0) {
        setChunks((prev) =>
          prev.filter((c) => !succeeded.has(c.publication_article_chunk_id))
        );
        onSaveMessage?.(
          succeeded.size === 1 ? "Chunk deleted." : `${succeeded.size} chunks deleted.`
        );
      }
      if (failed.length > 0) {
        onSaveError?.(
          failed.length === 1 ? "Failed to delete 1 chunk." : `Failed to delete ${failed.length} chunks.`
        );
      }

      setChunkSelectionActive(false);
      setSelectedChunkIds(new Set());
    } finally {
      setDeletingChunks(false);
    }
  }, [deletingChunks, selectedChunkIds, setChunks, onSaveError, onSaveMessage]);

  return {
    chunkSelectionActive,
    selectedChunkIds,
    deletingChunks,
    enterChunkSelectionMode,
    exitChunkSelectionMode,
    toggleChunkSelection,
    confirmDeleteSelectedChunks,
  };
}

