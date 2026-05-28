"use client";

import { useMemo } from "react";

import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { normalizeChunkFormat } from "../../magazineArticleColumnFlow";
import type { PublicationArticleChunk } from "../types";

export function useArticleHeadingHtml({
  chunks,
  slotIds,
}: {
  chunks: PublicationArticleChunk[];
  slotIds: number[];
}): { title: string | null; subtitle: string | null } {
  return useMemo(() => {
    const firstSlotId = slotIds[0];
    if (!firstSlotId) return { title: null, subtitle: null };

    const firstPageChunks = chunks.filter((c) => chunkPublicationSlotId(c) === firstSlotId);
    const titleChunk = firstPageChunks.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "title"
    );
    const subtitleChunk = firstPageChunks.find(
      (c) => normalizeChunkFormat(c.publication_article_chunk_format) === "subtitle"
    );

    return {
      title: titleChunk?.chunk_html ?? null,
      subtitle: subtitleChunk?.chunk_html ?? null,
    };
  }, [chunks, slotIds]);
}

