"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ArticleSubpageActionAlerts } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpageActionAlerts";
import type { MagazinePageLayout } from "./magazinePageLayout";
import { ArticleSubpagePagePreview } from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/ArticleSubpagePagePreview";
import {
  PublicationArticleChunk,
  PublicationArticleRow,
} from "@/app/logged/pages/production/publications/magazines/subpage/subpage_page_components/types";
import { ArticleBuilderLoadingView } from "./ArticleBuilderLoadingView";
import { ArticleBuilderPageEditorHeader } from "./ArticleBuilderPageEditorHeader";
import { ArticleBuilderContentEditor } from "./ArticleBuilderContentEditor";
import { ArticleImageManagerModal } from "./article_image_manager/ArticleImageManagerModal";
import { ArticleBuilderEmptyPageDeleteConfirmModal } from "./ArticleBuilderEmptyPageDeleteConfirmModal";
import { buildArticleFlowPagesFromPublicationSlots } from "./magazineArticleColumnFlow";
import { currentPreviewBodyDimensions } from "./magazinePreviewMeasurement";
import { useArticleContentSave, filterPreviewChunksForPage } from "./useArticleContentSave";
import { parseArticleBuilderPageParam } from "./articleBuilderNavigation";

type ArticleBuilderPageEditorPanelProps = {
  publicationId: string;
  publicationArticleId: string;
  pageFormat: MagazinePageLayout;
  pageParam: string;
  canNavigatePrev: boolean;
  canNavigateNext: boolean;
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onChunksChanged?: () => void;
};

export const ArticleBuilderPageEditorPanel: FC<ArticleBuilderPageEditorPanelProps> = ({
  publicationId,
  publicationArticleId,
  pageFormat,
  pageParam,
  canNavigatePrev,
  canNavigateNext,
  onNavigatePrev,
  onNavigateNext,
  onChunksChanged,
}) => {
  const { slotId } = useMemo(() => parseArticleBuilderPageParam(pageParam), [pageParam]);

  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [publicationEditionName, setPublicationEditionName] = useState("");
  const [slotPublicationPage, setSlotPublicationPage] = useState<number | null>(null);
  const [imageManagerOpen, setImageManagerOpen] = useState(false);
  const [emptyPageDeleteTarget, setEmptyPageDeleteTarget] = useState<
    { slotId: number; pageIndex: number } | null
  >(null);
  const [emptyPageDeleting, setEmptyPageDeleting] = useState(false);
  const [emptyPageDeleteError, setEmptyPageDeleteError] = useState<string | null>(null);
  const loadArticle = useCallback(async (options?: { silent?: boolean }) => {
    if (!publicationArticleId) {
      setPublicationArticle(null);
      setChunks([]);
      setError("Missing publication article.");
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}?ensure_all_magazine_slots=1`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to load publication_article");
      }
      const paJson = (await res.json()) as {
        publication_article: PublicationArticleRow;
        chunks: PublicationArticleChunk[];
      };
      const pa = paJson?.publication_article ?? null;
      setPublicationArticle(pa);
      setChunks(Array.isArray(paJson?.chunks) ? paJson.chunks : []);

    } catch (e: unknown) {
      setPublicationArticle(null);
      setChunks([]);
      setError(e instanceof Error ? e.message : "Failed to load article editor");
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId]);

  const loadSlotMeta = useCallback(async () => {
    if (!publicationId || !slotId) {
      setPublicationEditionName("");
      setSlotPublicationPage(null);
      return;
    }
    const pubDbUrl = `/api/v1/publications-db/${encodeURIComponent(publicationId)}`;
    const slotUrl = `/api/v1/publication-slots/${encodeURIComponent(String(slotId))}`;
    const [publicationDbRes, slotRes] = await Promise.all([
      fetch(pubDbUrl, { cache: "no-store", credentials: "include" }),
      fetch(slotUrl, { cache: "no-store", credentials: "include" }),
    ]);
    if (publicationDbRes.ok) {
      try {
        const pubRow = (await publicationDbRes.json()) as { publication_edition_name?: string };
        setPublicationEditionName(String(pubRow?.publication_edition_name ?? "").trim());
      } catch {
        setPublicationEditionName("");
      }
    } else {
      setPublicationEditionName("");
    }
    if (slotRes.ok) {
      try {
        const slotJson = (await slotRes.json()) as { publication_page?: number | null };
        const pp = slotJson?.publication_page;
        setSlotPublicationPage(
          pp != null && Number.isFinite(Number(pp)) ? Math.round(Number(pp)) : null
        );
      } catch {
        setSlotPublicationPage(null);
      }
    } else {
      setSlotPublicationPage(null);
    }
  }, [publicationId, slotId]);

  useEffect(() => {
    void loadArticle();
  }, [loadArticle]);

  useEffect(() => {
    void loadSlotMeta();
  }, [loadSlotMeta]);

  const articleFlowPages = useMemo(() => {
    const slotIds = Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle.publication_slots_id_array
          .map(Number)
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];
    return buildArticleFlowPagesFromPublicationSlots(
      slotIds.map((publication_slot_id) => ({ publication_slot_id })),
      chunks
    );
  }, [publicationArticle, chunks]);

  const previewChunks = useMemo(
    () => filterPreviewChunksForPage(chunks, slotId),
    [chunks, slotId]
  );

  const totalArticlePages = useMemo(() => {
    const arr = publicationArticle?.publication_slots_id_array;
    return Array.isArray(arr) ? arr.length : 0;
  }, [publicationArticle]);

  const {
    titleHtml,
    subtitleHtml,
    bodyHtml,
    savingField,
    scheduleTitleChange,
    scheduleSubtitleChange,
    scheduleBodyChange,
  } = useArticleContentSave({
    publicationArticleId,
    chunks,
    articleFlowPages,
    pageFormat,
    setChunks,
    onReload: async () => {
      await loadArticle({ silent: true });
      onChunksChanged?.();
    },
    onSaveMessage: setActionMessage,
    onSaveError: setActionError,
    getPreviewBodyDimensions: currentPreviewBodyDimensions,
  });

  const requestDeleteEmptyPage = useCallback(
    (slotIdToDelete: number, pageIndex: number) => {
      setEmptyPageDeleteError(null);
      setEmptyPageDeleteTarget({ slotId: slotIdToDelete, pageIndex });
    },
    []
  );

  const closeDeleteEmptyPageModal = useCallback(() => {
    if (emptyPageDeleting) return;
    setEmptyPageDeleteTarget(null);
    setEmptyPageDeleteError(null);
  }, [emptyPageDeleting]);

  const confirmDeleteEmptyPage = useCallback(async () => {
    if (!emptyPageDeleteTarget) return;
    const target = emptyPageDeleteTarget;
    setEmptyPageDeleting(true);
    setEmptyPageDeleteError(null);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(
          publicationArticleId
        )}/pages/${encodeURIComponent(String(target.slotId))}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let message = text || `Failed to delete article page (${res.status})`;
        try {
          const parsed = JSON.parse(text) as { message?: string };
          if (parsed?.message) message = parsed.message;
        } catch {
          /* use raw text */
        }
        throw new Error(message);
      }
      const wasCurrentSlot = Number(slotId) === Number(target.slotId);
      setEmptyPageDeleteTarget(null);
      setActionMessage(`Article page ${target.pageIndex} deleted.`);
      await loadArticle({ silent: true });
      onChunksChanged?.();
      if (wasCurrentSlot && canNavigatePrev) {
        onNavigatePrev();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to delete article page";
      setEmptyPageDeleteError(message);
    } finally {
      setEmptyPageDeleting(false);
    }
  }, [
    canNavigatePrev,
    emptyPageDeleteTarget,
    loadArticle,
    onChunksChanged,
    onNavigatePrev,
    publicationArticleId,
    slotId,
  ]);

  const { pageIndex, isLeftSpreadPage } = useMemo(() => {
    const arr = Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle.publication_slots_id_array
      : [];
    const idx = arr.findIndex((sid) => Number(sid) === Number(slotId));
    const pi = idx >= 0 ? idx + 1 : 0;
    const isLeft = pi > 0 && pi % 2 === 0;
    return { pageIndex: pi, isLeftSpreadPage: isLeft };
  }, [publicationArticle, slotId]);

  if (loading) {
    return <ArticleBuilderLoadingView label="Loading article editor" compact />;
  }

  if (!publicationArticle || !slotId) {
    return (
      <div className="py-10 text-center text-sm text-gray-600">
        {error ?? "Page not found."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ArticleSubpageActionAlerts actionError={actionError} actionMessage={actionMessage} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <div className="min-w-0 border-gray-200 lg:border-r lg:pr-6">
          <ArticleBuilderContentEditor
              titleHtml={titleHtml}
              subtitleHtml={subtitleHtml}
              bodyHtml={bodyHtml}
              savingField={savingField}
              articleFlowPages={articleFlowPages}
              pageFormat={pageFormat}
              onTitleChange={scheduleTitleChange}
              onSubtitleChange={scheduleSubtitleChange}
              onBodyChange={scheduleBodyChange}
              onRequestDeleteEmptyPage={requestDeleteEmptyPage}
          />
        </div>

        <div className="flex min-w-0 flex-col items-stretch bg-gray-50/80 p-4 lg:sticky lg:top-4 lg:items-center lg:self-start lg:rounded-xl">
          <div className="flex w-full max-w-[min(100%,28rem)] flex-col items-stretch gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Page preview</h2>
              <button
                type="button"
                onClick={() => setImageManagerOpen(true)}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
              >
                Article Image manager
              </button>
            </div>

            <ArticleBuilderPageEditorHeader
              publicationLabel={publicationEditionName || publicationId}
              publicationPage={slotPublicationPage}
              slotId={slotId}
              articleId={publicationArticle.article_id}
              pageIndexInArticle={pageIndex}
              totalArticlePages={totalArticlePages}
              canNavigatePrev={canNavigatePrev}
              canNavigateNext={canNavigateNext}
              onNavigatePrev={onNavigatePrev}
              onNavigateNext={onNavigateNext}
            />

            <ArticleSubpagePagePreview
              hideHeading
              chunks={previewChunks}
              pageIndex={pageIndex}
              isLeftPage={isLeftSpreadPage}
              publicationPage={slotPublicationPage}
              pageFormat={pageFormat}
              articleFlowPages={articleFlowPages}
              currentSlotContentId={slotId}
            />
          </div>
        </div>
      </div>

      <ArticleImageManagerModal
        open={imageManagerOpen}
        onClose={() => setImageManagerOpen(false)}
        publicationId={publicationId}
        publicationArticleId={publicationArticleId}
        publicationEditionName={publicationEditionName}
        articleId={publicationArticle.article_id}
        initialSlotId={slotId}
        initialSlotContentId={slotId}
        onCompleted={() => {
          void loadArticle({ silent: true });
          onChunksChanged?.();
        }}
      />

      <ArticleBuilderEmptyPageDeleteConfirmModal
        open={emptyPageDeleteTarget != null}
        pageIndex={emptyPageDeleteTarget?.pageIndex ?? 0}
        slotId={emptyPageDeleteTarget?.slotId ?? 0}
        totalPages={totalArticlePages}
        saving={emptyPageDeleting}
        error={emptyPageDeleteError}
        onClose={closeDeleteEmptyPageModal}
        onConfirm={() => void confirmDeleteEmptyPage()}
      />
    </div>
  );
};
