"use client";

import { useCallback, useMemo, useState } from "react";

import {
  chunkFormatIncludesImage,
  readChunkImageCaption,
} from "../../articleChunkPlainTextEditing";
import type { PublicationArticleChunk } from "../types";

export function useImageCaptionModal({
  chunks,
  setChunks,
  onSaveMessage,
  onSaveError,
}: {
  chunks: PublicationArticleChunk[];
  setChunks: React.Dispatch<React.SetStateAction<PublicationArticleChunk[]>>;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
}) {
  const [captionModalChunkId, setCaptionModalChunkId] = useState<string | null>(null);
  const [savingCaption, setSavingCaption] = useState(false);

  const captionModalChunk = useMemo(
    () =>
      captionModalChunkId
        ? chunks.find((c) => c.publication_article_chunk_id === captionModalChunkId) ??
          null
        : null,
    [captionModalChunkId, chunks]
  );

  const captionModalCurrentCaption = captionModalChunk
    ? readChunkImageCaption(captionModalChunk)
    : "";

  const handleChunkCaptionUpdate = useCallback(
    (chunkId: string) => {
      const chunk = chunks.find((c) => c.publication_article_chunk_id === chunkId);
      if (!chunk || !chunkFormatIncludesImage(chunk.publication_article_chunk_format)) {
        return;
      }
      setCaptionModalChunkId(chunkId);
    },
    [chunks]
  );

  const handleApplyImageCaption = useCallback(
    async (nextCaption: string) => {
      if (!captionModalChunkId) return;
      setSavingCaption(true);
      try {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(captionModalChunkId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ chunk_image_caption: nextCaption }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to update caption");
        }
        const updated = (await res.json()) as PublicationArticleChunk;
        setChunks((prev) =>
          prev.map((c) =>
            c.publication_article_chunk_id === captionModalChunkId ? { ...c, ...updated } : c
          )
        );
        setCaptionModalChunkId(null);
        onSaveMessage?.("Caption saved.");
      } catch (e: unknown) {
        onSaveError?.(e instanceof Error ? e.message : "Failed to update caption");
      } finally {
        setSavingCaption(false);
      }
    },
    [captionModalChunkId, onSaveError, onSaveMessage, setChunks]
  );

  return {
    captionModalChunkId,
    setCaptionModalChunkId,
    savingCaption,
    captionModalCurrentCaption,
    handleChunkCaptionUpdate,
    handleApplyImageCaption,
  };
}

