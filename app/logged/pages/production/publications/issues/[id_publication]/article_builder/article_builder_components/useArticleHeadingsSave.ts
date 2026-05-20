"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MagazineArticleFlowPageInput } from "./magazineArticleColumnFlow";
import {
  findHeadingChunk,
  firstArticleSlotContentId,
  type PublicationArticleChunkLike,
} from "./articleContentModel";

type ChunkRow = PublicationArticleChunkLike & {
  publication_article_id?: string;
  publication_id?: string;
};

async function patchChunk(chunkId: string, body: Record<string, unknown>): Promise<ChunkRow> {
  const res = await fetch(`/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to update chunk");
  }
  return (await res.json()) as ChunkRow;
}

async function createChunk(
  publicationArticleId: string,
  body: Record<string, unknown>
): Promise<ChunkRow> {
  const res = await fetch(
    `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || "Failed to create chunk");
  }
  return (await res.json()) as ChunkRow;
}

/**
 * Headings-only autosave. Manages title + subtitle drafts and persists changes
 * (with debounce) against the first article page's chunks. The article body is
 * intentionally not handled here.
 */
export function useArticleHeadingsSave<T extends ChunkRow>(options: {
  publicationArticleId: string;
  chunks: T[];
  articleFlowPages: MagazineArticleFlowPageInput[];
  setChunks: React.Dispatch<React.SetStateAction<T[]>>;
  onSaveMessage?: (message: string | null) => void;
  onSaveError?: (message: string | null) => void;
}) {
  const {
    publicationArticleId,
    chunks,
    articleFlowPages,
    setChunks,
    onSaveMessage,
    onSaveError,
  } = options;

  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;

  const [savingField, setSavingField] = useState<"title" | "subtitle" | null>(null);

  const firstSlotId = firstArticleSlotContentId(articleFlowPages);

  const [titleDraft, setTitleDraft] = useState("");
  const [subtitleDraft, setSubtitleDraft] = useState("");

  useEffect(() => {
    setTitleDraft(findHeadingChunk(chunks, "title", firstSlotId)?.chunk_html ?? "");
    setSubtitleDraft(findHeadingChunk(chunks, "subtitle", firstSlotId)?.chunk_html ?? "");
  }, [chunks, firstSlotId]);

  useEffect(() => {
    setTitleDraft(findHeadingChunk(chunksRef.current, "title", firstSlotId)?.chunk_html ?? "");
    setSubtitleDraft(
      findHeadingChunk(chunksRef.current, "subtitle", firstSlotId)?.chunk_html ?? ""
    );
  }, [publicationArticleId, firstSlotId]);

  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
      if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
    },
    []
  );

  const ensureHeadingChunk = useCallback(
    async (format: "title" | "subtitle", html: string): Promise<string> => {
      const existing = findHeadingChunk(chunksRef.current, format, firstSlotId);
      if (existing) return existing.publication_article_chunk_id;

      if (firstSlotId == null) {
        throw new Error("Article page 1 is not provisioned yet.");
      }

      const created = await createChunk(publicationArticleId, {
        publication_article_chunk_format: format,
        chunk_html: html,
        chunk_position: format === "title" ? 0 : 1,
        publication_slot_id: firstSlotId,
      });
      setChunks((prev) => [...prev, created as T]);
      return created.publication_article_chunk_id;
    },
    [firstSlotId, publicationArticleId, setChunks]
  );

  const saveHeadingHtml = useCallback(
    async (format: "title" | "subtitle", html: string) => {
      setSavingField(format);
      onSaveError?.(null);
      try {
        const chunkId = await ensureHeadingChunk(format, html);
        const updated = await patchChunk(chunkId, { chunk_html: html });
        setChunks((prev) =>
          prev.map((c) =>
            c.publication_article_chunk_id === chunkId ? ({ ...c, ...updated } as T) : c
          )
        );
        onSaveMessage?.(format === "title" ? "Title saved." : "Subtitle saved.");
      } catch (e: unknown) {
        onSaveError?.(
          e instanceof Error
            ? e.message
            : format === "title"
              ? "Failed to save title"
              : "Failed to save subtitle"
        );
      } finally {
        setSavingField(null);
      }
    },
    [ensureHeadingChunk, onSaveError, onSaveMessage, setChunks]
  );

  const scheduleHeadingChange = useCallback(
    (format: "title" | "subtitle", html: string) => {
      const ref = format === "title" ? titleTimerRef : subtitleTimerRef;
      const setDraft = format === "title" ? setTitleDraft : setSubtitleDraft;
      setDraft(html);
      setChunks((prev) => {
        const id = findHeadingChunk(prev, format, firstSlotId)?.publication_article_chunk_id;
        if (!id) return prev;
        return prev.map((c) =>
          c.publication_article_chunk_id === id ? { ...c, chunk_html: html } : c
        );
      });
      if (ref.current) clearTimeout(ref.current);
      ref.current = setTimeout(() => {
        ref.current = null;
        void saveHeadingHtml(format, html);
      }, 700);
    },
    [firstSlotId, saveHeadingHtml, setChunks]
  );

  const scheduleTitleChange = useCallback(
    (html: string) => scheduleHeadingChange("title", html),
    [scheduleHeadingChange]
  );
  const scheduleSubtitleChange = useCallback(
    (html: string) => scheduleHeadingChange("subtitle", html),
    [scheduleHeadingChange]
  );

  return {
    titleHtml: titleDraft,
    subtitleHtml: subtitleDraft,
    savingField,
    scheduleTitleChange,
    scheduleSubtitleChange,
  };
}
