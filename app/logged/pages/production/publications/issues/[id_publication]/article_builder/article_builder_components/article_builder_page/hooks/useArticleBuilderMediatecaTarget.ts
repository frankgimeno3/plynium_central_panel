"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { MediatecaContent } from "@/app/logged/logged_components/modals/MediatecaModal";
import {
  articleMaterialsMediatecaPath,
  articleSlotMaterialsMediatecaPath,
} from "@/app/contents/mediatecaPaths";

import { writeChunkImageSrc } from "../../articleChunkPlainTextEditing";
import type { PublicationArticleChunk } from "../types";
import type { AreaImageDraft } from "../../ArticleBuilderImageAreaModals";

export type MediatecaTarget =
  | { kind: "chunk"; chunkId: string; slotId: number | null }
  | { kind: "image-area-draft"; areaId: string };

export function useArticleBuilderMediatecaTarget({
  chunks,
  editionName,
  publicationId,
  publicationArticleId,
  publicationArticleArticleId,
  addImagesSlotId,
  saveChunkHtmlNow,
  setPickerDrafts,
}: {
  chunks: PublicationArticleChunk[];
  editionName: string | null;
  publicationId: string | null | undefined;
  publicationArticleId: string;
  publicationArticleArticleId: string;
  addImagesSlotId: number | null;
  saveChunkHtmlNow: (chunkId: string, html: string) => Promise<void>;
  setPickerDrafts: React.Dispatch<React.SetStateAction<AreaImageDraft[] | null>>;
}) {
  const [mediatecaTarget, setMediatecaTarget] = useState<MediatecaTarget | null>(null);
  /** `slot_article_id` from RDS — folder names use this, not always `publicationArticle.article_id`. */
  const [slotArticleIdForMediateca, setSlotArticleIdForMediateca] = useState<string | null>(
    null
  );

  const mediatecaArticleId = slotArticleIdForMediateca ?? publicationArticleArticleId;

  const ensureSlotMediatecaFolder = useMemo(() => {
    if (!mediatecaTarget || !publicationId) return undefined;
    const slotId =
      mediatecaTarget.kind === "image-area-draft" ? addImagesSlotId : mediatecaTarget.slotId;
    if (typeof slotId === "number" && slotId > 0) {
      return { publicationId, slotId };
    }
    return undefined;
  }, [mediatecaTarget, addImagesSlotId, publicationId]);

  const mediatecaSlotIdForFetch = useMemo(() => {
    if (!mediatecaTarget) return null;
    if (mediatecaTarget.kind === "image-area-draft") return addImagesSlotId;
    return mediatecaTarget.slotId;
  }, [mediatecaTarget, addImagesSlotId]);

  useEffect(() => {
    let cancelled = false;
    const slotId = mediatecaSlotIdForFetch;
    if (slotId == null || slotId <= 0) {
      setSlotArticleIdForMediateca(null);
      return () => {
        cancelled = true;
      };
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/v1/publication-slots/${encodeURIComponent(String(slotId))}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) {
          if (!cancelled) setSlotArticleIdForMediateca(null);
          return;
        }
        const json = (await res.json()) as { slot_article_id?: string | null };
        const fromSlot = String(json?.slot_article_id ?? "").trim();
        if (!cancelled) {
          setSlotArticleIdForMediateca(fromSlot || publicationArticleArticleId || null);
        }
      } catch {
        if (!cancelled) setSlotArticleIdForMediateca(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mediatecaSlotIdForFetch, publicationArticleArticleId]);

  const mediatecaPathForSlot = useCallback(
    (slotId: number | null | undefined) => {
      const sid = typeof slotId === "number" && slotId > 0 ? slotId : null;
      if (sid != null) {
        return articleSlotMaterialsMediatecaPath(editionName, mediatecaArticleId, sid);
      }
      return articleMaterialsMediatecaPath(editionName, mediatecaArticleId);
    },
    [editionName, mediatecaArticleId]
  );

  const mediatecaInitialPath = useMemo(() => {
    if (!mediatecaTarget || ensureSlotMediatecaFolder) return undefined;
    if (!editionName?.trim()) return undefined;
    if (mediatecaTarget.kind === "image-area-draft") {
      return mediatecaPathForSlot(addImagesSlotId);
    }
    return mediatecaPathForSlot(mediatecaTarget.slotId);
  }, [
    mediatecaTarget,
    ensureSlotMediatecaFolder,
    editionName,
    mediatecaPathForSlot,
    addImagesSlotId,
  ]);

  const handleChunkImageUpdate = useCallback(
    (chunkId: string) => {
      const chunk = chunks.find((c) => c.publication_article_chunk_id === chunkId);
      if (!chunk) return;
      setMediatecaTarget({
        kind: "chunk",
        chunkId,
        slotId:
          typeof chunk.publication_slot_id === "number" && chunk.publication_slot_id > 0
            ? chunk.publication_slot_id
            : null,
      });
    },
    [chunks]
  );

  const handlePickerOpenMediateca = useCallback((areaId: string) => {
    setMediatecaTarget({ kind: "image-area-draft", areaId });
  }, []);

  const handleMediatecaSelect = useCallback(
    async (imageUrl: string, content?: Pick<MediatecaContent, "id" | "name">) => {
      const target = mediatecaTarget;
      setMediatecaTarget(null);
      if (!target) return;

      if (target.kind === "image-area-draft") {
        const name = content?.name?.trim() || null;
        setPickerDrafts((prev) =>
          prev
            ? prev.map((d) =>
                d.id === target.areaId
                  ? {
                      ...d,
                      imageUrl: String(imageUrl),
                      imageAlt: name,
                      mediaName: name,
                    }
                  : d
              )
            : prev
        );
        return;
      }

      const chunk = chunks.find((c) => c.publication_article_chunk_id === target.chunkId);
      if (!chunk) return;
      const nextHtml = writeChunkImageSrc(
        chunk.chunk_html,
        chunk.publication_article_chunk_format,
        imageUrl,
        content?.name ?? null
      );
      if (nextHtml === chunk.chunk_html) return;
      await saveChunkHtmlNow(target.chunkId, nextHtml);
    },
    [chunks, mediatecaTarget, saveChunkHtmlNow, setPickerDrafts]
  );

  return {
    mediatecaTarget,
    setMediatecaTarget,
    ensureSlotMediatecaFolder,
    mediatecaInitialPath,
    handleChunkImageUpdate,
    handlePickerOpenMediateca,
    handleMediatecaSelect,
  };
}

