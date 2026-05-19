"use client";

import React, { FC, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ArticleChunkColumnOverflowModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticleChunkColumnOverflowModal";
import { ArticlePageFormatChangeConfirmModal } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/ArticlePageFormatChangeConfirmModal";
import { useArticleChunkColumnOverflowSave } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/useArticleChunkColumnOverflowSave";
import {
  DEFAULT_MAGAZINE_PAGE_LAYOUT,
  normalizeMagazinePageLayout,
  type MagazinePageLayout,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";
import { buildArticleFlowPagesFromPublicationSlots } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { ArticleSubpageActionAlerts } from "./ArticleSubpageActionAlerts";
import { ArticleSubpageChunksSection } from "./ArticleSubpageChunksSection";
import { ArticleSubpageHeader } from "./ArticleSubpageHeader";
import { ArticleSubpagePageFormatSection } from "./ArticleSubpagePageFormatSection";
import { ArticleSubpagePagePreview } from "./ArticleSubpagePagePreview";
import {
  articleBuilderHref,
  ChunkFormat,
  parseSubpageId,
  PublicationArticleChunk,
  PublicationArticleRow,
} from "./types";

export const ArticleSubpagePageContent: FC = () => {
  const searchParams = useSearchParams();
  const id_publication = searchParams.get("issue") ?? "";
  const publicationArticleId = searchParams.get("item") ?? "";
  const article_subpage_id = searchParams.get("page") ?? "";
  const { setPageMeta } = usePageContent();

  const { slotId } = useMemo(() => parseSubpageId(article_subpage_id), [article_subpage_id]);

  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingChunkIdLegacy, setSavingChunkIdLegacy] = useState<string | null>(null);
  const [pageFormatDraft, setPageFormatDraft] = useState<MagazinePageLayout>(DEFAULT_MAGAZINE_PAGE_LAYOUT);
  const [publicationEditionName, setPublicationEditionName] = useState("");
  const [slotPublicationPage, setSlotPublicationPage] = useState<number | null>(null);
  const [pageFormatSaving, setPageFormatSaving] = useState(false);
  const [pendingPageFormat, setPendingPageFormat] = useState<MagazinePageLayout | null>(null);
  const chunksRef = useRef<PublicationArticleChunk[]>([]);

  const mergeChunkFromApi = useCallback((updated: PublicationArticleChunk) => {
    setChunks((prev) =>
      prev.map((c) =>
        c.publication_article_chunk_id === updated.publication_article_chunk_id
          ? { ...c, ...updated }
          : c
      )
    );
  }, []);

  const loadAll = useCallback(async (options?: { silent?: boolean }) => {
    if (!publicationArticleId) {
      setPublicationArticle(null);
      setChunks([]);
      setPublicationEditionName("");
      setSlotPublicationPage(null);
      setError("Missing publication article id.");
      setLoading(false);
      return;
    }

    if (!options?.silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const ensureQs =
        slotId != null && Number.isFinite(slotId) && slotId > 0
          ? `?ensure_slot_id=${encodeURIComponent(String(slotId))}`
          : "";
      const pubDbUrl = id_publication
        ? `/api/v1/publications-db/${encodeURIComponent(id_publication)}`
        : null;
      const slotIdNum =
        slotId != null && Number.isFinite(Number(slotId)) && Number(slotId) > 0 ? Number(slotId) : null;
      const slotUrl =
        slotIdNum != null
          ? `/api/v1/publication-slots/${encodeURIComponent(String(slotIdNum))}`
          : null;
      const [paRes, publicationDbRes, slotRes] = await Promise.all([
        fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}${ensureQs}`,
          { cache: "no-store", credentials: "include" }
        ),
        pubDbUrl
          ? fetch(pubDbUrl, { cache: "no-store", credentials: "include" })
          : Promise.resolve(null as Response | null),
        slotUrl
          ? fetch(slotUrl, { cache: "no-store", credentials: "include" })
          : Promise.resolve(null as Response | null),
      ]);
      if (publicationDbRes?.ok) {
        try {
          const pubRow = (await publicationDbRes.json()) as { publication_edition_name?: string };
          setPublicationEditionName(String(pubRow?.publication_edition_name ?? "").trim());
        } catch {
          setPublicationEditionName("");
        }
      } else {
        setPublicationEditionName("");
      }
      if (slotRes?.ok) {
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
      if (!paRes.ok) {
        const txt = await paRes.text().catch(() => "");
        throw new Error(txt || "Failed to load publication_article");
      }
      const paJson = (await paRes.json()) as {
        publication_article: PublicationArticleRow;
        chunks: PublicationArticleChunk[];
        magazine_page_layout?: MagazinePageLayout;
      };
      const pa = paJson?.publication_article ?? null;
      setPublicationArticle(pa);
      setChunks(Array.isArray(paJson?.chunks) ? paJson.chunks : []);
      setPageFormatDraft(
        paJson?.magazine_page_layout != null
          ? normalizeMagazinePageLayout(paJson.magazine_page_layout)
          : DEFAULT_MAGAZINE_PAGE_LAYOUT
      );

    } catch (e: unknown) {
      setPublicationArticle(null);
      setChunks([]);
      setSlotPublicationPage(null);
      setError(e instanceof Error ? e.message : "Failed to load subpage");
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId, id_publication, slotId]);

  const requestPageFormatChange = useCallback(
    (layout: MagazinePageLayout) => {
      const normalized = normalizeMagazinePageLayout(layout);
      if (normalized === pageFormatDraft) return;
      setActionError(null);
      setPendingPageFormat(normalized);
    },
    [pageFormatDraft]
  );

  const cancelPageFormatChange = useCallback(() => {
    if (pageFormatSaving) return;
    setPendingPageFormat(null);
    setActionError(null);
  }, [pageFormatSaving]);

  const confirmPageFormatChange = useCallback(async () => {
    if (!pendingPageFormat || !publicationArticleId) return;
    const normalized = pendingPageFormat;
    setPageFormatSaving(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ magazine_page_layout: normalized }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to save article page format");
      }
      window.location.reload();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to save article page format");
      setPageFormatSaving(false);
    }
  }, [pendingPageFormat, publicationArticleId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Article Subpage",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        {
          label: "Publications",
          href: "/logged/pages/production/publications/issues",
        },
        ...(id_publication
          ? [
              {
                label: `Issue ${id_publication}`,
                href: `/logged/pages/production/publications/issues/${encodeURIComponent(id_publication)}`,
              },
            ]
          : []),
        ...(id_publication && publicationArticleId
          ? [
              {
                label: "Article Builder",
                href: articleBuilderHref(id_publication, publicationArticleId),
              },
            ]
          : []),
        { label: "Subpage" },
      ],
      buttons:
        id_publication && publicationArticleId
          ? [
              {
                label: "Back to Article Builder",
                href: articleBuilderHref(id_publication, publicationArticleId),
              },
            ]
          : [],
    });
  }, [setPageMeta, id_publication, publicationArticleId]);

  const subpageChunks = useMemo(() => {
    if (!slotId) return [];
    return chunks
      .filter((c) => chunkPublicationSlotId(c) === slotId)
      .slice()
      .sort((a, b) => a.chunk_position - b.chunk_position);
  }, [chunks, slotId]);

  const totalArticlePages = useMemo(() => {
    const arr = publicationArticle?.publication_slots_id_array;
    return Array.isArray(arr) ? arr.length : 0;
  }, [publicationArticle]);

  const articleFlowPages = useMemo(() => {
    const slotIds = Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    return buildArticleFlowPagesFromPublicationSlots(
      slotIds.map((publication_slot_id) => ({ publication_slot_id })),
      chunks
    );
  }, [publicationArticle, chunks]);

  const updateChunk = useCallback(
    async (chunkId: string, payload: Partial<PublicationArticleChunk>) => {
      setActionError(null);
      setActionMessage(null);
      setSavingChunkIdLegacy(chunkId);
      setChunks((prev) =>
        prev.map((c) =>
          c.publication_article_chunk_id === chunkId ? { ...c, ...payload } : c
        )
      );
      try {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to update chunk");
        }
        const updated = (await res.json()) as PublicationArticleChunk;
        mergeChunkFromApi(updated);
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to update chunk");
        void loadAll({ silent: true });
      } finally {
        setSavingChunkIdLegacy(null);
      }
    },
    [loadAll, mergeChunkFromApi]
  );

  const removeChunk = useCallback(
    async (chunkId: string) => {
      const ok = window.confirm("Delete this chunk?");
      if (!ok) return;
      setActionError(null);
      setActionMessage(null);
      try {
        const res = await fetch(
          `/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`,
          { method: "DELETE", credentials: "include" }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to delete chunk");
        }
        setChunks((prev) => prev.filter((c) => c.publication_article_chunk_id !== chunkId));
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to delete chunk");
      }
    },
    []
  );

  const addChunkAtPosition = useCallback(
    async (position: number) => {
      if (!publicationArticle || !slotId) return;
      setActionError(null);
      setActionMessage(null);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/chunks`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              publication_article_chunk_format: "only_text",
              chunk_html: "",
              chunk_position: position,
              publication_slot_id: slotId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to add chunk");
        }
        const created = (await res.json()) as PublicationArticleChunk;
        setChunks((prev) => [...prev, created]);
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to add chunk");
      }
    },
    [publicationArticle, slotId, publicationArticleId]
  );

  const moveChunkBy = useCallback(
    async (chunkId: string, delta: number) => {
      const sorted = subpageChunks;
      const idx = sorted.findIndex((c) => c.publication_article_chunk_id === chunkId);
      if (idx === -1) return;
      const swapWith = sorted[idx + delta];
      if (!swapWith) return;
      const current = sorted[idx];
      await updateChunk(current.publication_article_chunk_id, {
        chunk_position: swapWith.chunk_position,
      });
      await updateChunk(swapWith.publication_article_chunk_id, {
        chunk_position: current.chunk_position,
      });
    },
    [subpageChunks, updateChunk]
  );

  const {
    savingChunkId: savingHtmlChunkId,
    handleChunkHtmlChange,
    pendingOverflow,
    overflowSaving,
    overflowError,
    cancelOverflow,
    confirmOverflow,
    clearSaveTimers,
  } = useArticleChunkColumnOverflowSave({
    publicationArticleId,
    chunks,
    articleFlowPages,
    pageFormat: pageFormatDraft,
    activeSlotContentId: slotId,
    mergeChunkFromApi,
    setChunks,
    onSaveMessage: setActionMessage,
    onSaveError: setActionError,
    onAfterApply: () => {
      void loadAll({ silent: true });
      setActionMessage("Chunk split across pages.");
    },
  });

  const savingChunkId = savingChunkIdLegacy ?? savingHtmlChunkId;

  useEffect(() => {
    chunksRef.current = chunks;
  }, [chunks]);

  useEffect(() => () => clearSaveTimers(), [clearSaveTimers]);

  const handleFormatChange = useCallback(
    (chunkId: string, format: ChunkFormat) => {
      void updateChunk(chunkId, { publication_article_chunk_format: format });
    },
    [updateChunk]
  );

  const { pageIndex, isLeftSpreadPage } = useMemo(() => {
    const arr = Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle.publication_slots_id_array
      : [];
    const idx = arr.findIndex((sid) => Number(sid) === Number(slotId));
    const pi = idx >= 0 ? idx + 1 : 0;
    // Odd editorial page index = right-hand spread; even = left-hand spread.
    const isLeft = pi > 0 && pi % 2 === 0;
    return { pageIndex: pi, isLeftSpreadPage: isLeft };
  }, [publicationArticle, slotId]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading subpage…</div>
      </PageContentSection>
    );
  }

  if (!publicationArticle || !slotId || !id_publication || !publicationArticleId) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Subpage not found."}</p>
          {id_publication && publicationArticleId ? (
            <Link
              href={articleBuilderHref(id_publication, publicationArticleId)}
              className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Back to Article Builder
            </Link>
          ) : null}
        </div>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <ArticleSubpageHeader
          publicationLabel={publicationEditionName || id_publication}
          publicationPage={slotPublicationPage}
          slotId={slotId}
          articleId={publicationArticle.article_id}
          pageIndexInArticle={pageIndex}
          totalArticlePages={totalArticlePages}
        />

        <ArticleSubpageActionAlerts actionError={actionError} actionMessage={actionMessage} />

        <div className="grid min-h-0 grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="flex min-h-0 min-w-0 flex-col gap-4 border-gray-200 lg:border-r lg:pr-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Chunk editor</h2>
              <p className="mt-1 text-xs text-gray-600">
                {pageIndex > 0 ? (
                  <>
                    Spread side:{" "}
                    <strong className="text-gray-900">
                      {isLeftSpreadPage ? "left" : "right"}
                    </strong>
                    <span className="text-gray-500"> · editorial page number {pageIndex}</span>
                  </>
                ) : (
                  <span className="text-amber-700">
                    Could not place this page in the article page order.
                  </span>
                )}
              </p>
            </div>

            <ArticleSubpagePageFormatSection
              pageFormatDraft={pageFormatDraft}
              onPageFormatChange={(formatId) =>
                requestPageFormatChange(formatId as MagazinePageLayout)
              }
            />
            {pageFormatSaving ? (
              <p className="text-[10px] text-blue-600">Saving article page format…</p>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto lg:max-h-[calc(100vh-14rem)]">
              <ArticleSubpageChunksSection
                slotId={slotId}
                subpageChunks={subpageChunks}
                savingChunkId={savingChunkId}
                onAddChunkAt={(position) => void addChunkAtPosition(position)}
                onFormatChange={handleFormatChange}
                onMoveUp={(chunkId) => void moveChunkBy(chunkId, -1)}
                onMoveDown={(chunkId) => void moveChunkBy(chunkId, 1)}
                onDelete={(chunkId) => void removeChunk(chunkId)}
                onHtmlChange={handleChunkHtmlChange}
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col items-stretch bg-gray-50/80 p-4 lg:items-center lg:rounded-xl">
            <ArticleSubpagePagePreview
              chunks={subpageChunks}
              pageIndex={pageIndex}
              isLeftPage={isLeftSpreadPage}
              publicationPage={slotPublicationPage}
              pageFormat={pageFormatDraft}
              articleFlowPages={articleFlowPages}
              currentSlotContentId={slotId}
            />
          </div>
        </div>

        <ArticleChunkColumnOverflowModal
          pending={pendingOverflow}
          saving={overflowSaving}
          error={overflowError}
          onClose={cancelOverflow}
          onConfirm={() => void confirmOverflow()}
        />

        <ArticlePageFormatChangeConfirmModal
          open={pendingPageFormat != null}
          currentLayout={pageFormatDraft}
          nextLayout={pendingPageFormat ?? pageFormatDraft}
          saving={pageFormatSaving}
          error={actionError}
          onClose={cancelPageFormatChange}
          onConfirm={() => void confirmPageFormatChange()}
        />
      </div>
    </PageContentSection>
  );
};

export default function ArticleSubpagePage() {
  return (
    <Suspense
      fallback={
        <PageContentSection>
          <div className="p-6 text-center text-gray-500">Loading subpage…</div>
        </PageContentSection>
      }
    >
      <ArticleSubpagePageContent />
    </Suspense>
  );
}
