"use client";

import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import { isPublicationArticleStateValue } from "../../../../../../publication_components/_shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatArticleBuilderPageParam,
  parseArticleBuilderPageParam,
  publicationArticleEditorPageHref,
  type ArticleBuilderGeneralSection,
  type ArticleBuilderTab,
} from "../../articleBuilderNavigation";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import {
  DEFAULT_MAGAZINE_PAGE_LAYOUT,
  normalizeMagazinePageLayout,
  type MagazinePageLayout,
} from "../../magazinePageLayout";
import {
  chunkPageOverflowIds,
  dedupeChunksForDisplay,
  isTitleOrSubtitleChunkFormat,
} from "../chunkUtils";
import { STANDALONE_PUBLICATION_ARTICLE_PREFIX } from "../constants";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";
import { issuePublicationSelectedContentsHref } from "../issueNavigation";
import type { ArticleMeta, PublicationArticleChunk, PublicationArticleRow } from "../types";

export function useArticleBuilderPage(idPublication: string, publicationArticleId: string) {
  const { setPageMeta } = usePageContent();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [articleMeta, setArticleMeta] = useState<ArticleMeta | null>(null);
  const [slotPublicationPageBySlotId, setSlotPublicationPageBySlotId] = useState<
    Record<number, number>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [pageCountInput, setPageCountInput] = useState<number>(1);
  const [syncing, setSyncing] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyChunkId, setBusyChunkId] = useState<string | null>(null);
  const [bulkChunkMoveBusy, setBulkChunkMoveBusy] = useState(false);
  const [deleteChunkModal, setDeleteChunkModal] = useState<PublicationArticleChunk | null>(null);
  const [articleStateSaving, setArticleStateSaving] = useState(false);
  const [flatplanNameSaving, setFlatplanNameSaving] = useState(false);
  const [magazinePageLayout, setMagazinePageLayout] = useState<MagazinePageLayout>(
    DEFAULT_MAGAZINE_PAGE_LAYOUT
  );
  const [pageFormatSaving, setPageFormatSaving] = useState(false);
  const [pendingPageFormat, setPendingPageFormat] = useState<MagazinePageLayout | null>(null);

  const mainTab: ArticleBuilderTab =
    searchParams.get("tab") === "editor" ? "editor" : "general";
  const generalSection: ArticleBuilderGeneralSection =
    searchParams.get("section") === "original" ? "original" : "pages-manager";
  const editorPageParam = searchParams.get("page") ?? "";

  const replaceBuilderQuery = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const setMainTab = useCallback(
    (tab: ArticleBuilderTab) => {
      replaceBuilderQuery((params) => {
        if (tab === "general") {
          params.delete("tab");
          params.delete("page");
        } else {
          params.set("tab", "editor");
        }
      });
    },
    [replaceBuilderQuery]
  );

  const requestPageFormatChange = useCallback(
    (layout: MagazinePageLayout) => {
      const normalized = normalizeMagazinePageLayout(layout);
      if (normalized === magazinePageLayout) return;
      setActionError(null);
      setPendingPageFormat(normalized);
    },
    [magazinePageLayout]
  );

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
      setMagazinePageLayout(normalized);
      setPendingPageFormat(null);
      setActionMessage("Article page format saved.");
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to save article page format");
    } finally {
      setPageFormatSaving(false);
    }
  }, [pendingPageFormat, publicationArticleId]);

  const cancelPageFormatChange = useCallback(() => {
    if (!pageFormatSaving) {
      setPendingPageFormat(null);
      setActionError(null);
    }
  }, [pageFormatSaving]);

  const setGeneralSection = useCallback(
    (section: ArticleBuilderGeneralSection) => {
      replaceBuilderQuery((params) => {
        if (section === "pages-manager") {
          params.delete("section");
        } else {
          params.set("section", section);
        }
      });
    },
    [replaceBuilderQuery]
  );

  const load = useCallback(async (options?: { silent?: boolean }) => {
    // `silent` skips the full-page loading view, which is the behaviour we
    // want after autosaves (the editor / preview still re-render via the new
    // chunks state, but no spinner flashes over the article builder).
    if (!options?.silent) {
      setLoading(true);
      setSlotPublicationPageBySlotId({});
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
      const json = (await res.json()) as {
        publication_article: PublicationArticleRow;
        chunks: PublicationArticleChunk[];
        magazine_page_layout?: MagazinePageLayout;
      };
      const pa = json?.publication_article ?? null;
      setPublicationArticle(pa);
      setChunks(Array.isArray(json?.chunks) ? json.chunks : []);
      setMagazinePageLayout(
        json?.magazine_page_layout != null
          ? normalizeMagazinePageLayout(json.magazine_page_layout)
          : DEFAULT_MAGAZINE_PAGE_LAYOUT
      );
      setPageCountInput(pa?.desired_page_count ?? 1);

      if (pa?.article_id) {
        try {
          const aRes = await fetch(`/api/v1/articles/${encodeURIComponent(pa.article_id)}`, {
            cache: "no-store",
            credentials: "include",
          });
          if (aRes.ok) {
            setArticleMeta((await aRes.json()) as ArticleMeta);
          } else {
            setArticleMeta(null);
          }
        } catch {
          setArticleMeta(null);
        }
      } else {
        setArticleMeta(null);
      }

      const slotIds = Array.isArray(pa?.publication_slots_id_array)
        ? pa.publication_slots_id_array
        : [];
      if (slotIds.length) {
        try {
          const pageBySlot: Record<number, number> = {};
          const slotRows = await Promise.all(
            slotIds.map(async (rawSid) => {
              const sid = Number(rawSid);
              if (!Number.isFinite(sid) || sid <= 0) return null;
              const sr = await fetch(`/api/v1/publication-slots/${encodeURIComponent(String(sid))}`, {
                cache: "no-store",
                credentials: "include",
              });
              if (!sr.ok) return null;
              try {
                const row = (await sr.json()) as { publication_page?: number | null };
                const pp = row?.publication_page;
                if (pp != null && Number.isFinite(Number(pp))) {
                  return { sid, page: Math.round(Number(pp)) };
                }
              } catch {
                /* ignore */
              }
              return null;
            })
          );
          for (const row of slotRows) {
            if (row) pageBySlot[row.sid] = row.page;
          }
          setSlotPublicationPageBySlotId(pageBySlot);
        } catch {
          setSlotPublicationPageBySlotId({});
        }
      } else {
        setSlotPublicationPageBySlotId({});
      }
    } catch (e: unknown) {
      setPublicationArticle(null);
      setChunks([]);
      setArticleMeta(null);
      setSlotPublicationPageBySlotId({});
      setError(e instanceof Error ? e.message : "Failed to load publication_article");
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId, idPublication]);

  useEffect(() => {
    void load();
  }, [load]);

  const prevMainTabRef = useRef(mainTab);
  useEffect(() => {
    if (prevMainTabRef.current === "editor" && mainTab === "general") {
      void load();
    }
    prevMainTabRef.current = mainTab;
  }, [mainTab, load]);

  useEffect(() => {
    if (!deleteChunkModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeleteChunkModal(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteChunkModal]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Article Builder",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: "/logged/pages/production/publications/issues" },
        {
          label: `Issue ${idPublication}`,
          href: issuePublicationSelectedContentsHref(idPublication),
        },
        { label: "Article Builder" },
      ],
      buttons: [
        {
          label: "Back to publication",
          href: issuePublicationSelectedContentsHref(idPublication),
        },
      ],
    });
  }, [setPageMeta, idPublication]);

  const pages = useMemo(() => {
    const arr = Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle!.publication_slots_id_array
      : [];
    return arr.map((slotId, index) => {
      const sid = Number(slotId);
      const chunkIds = chunks
        .filter((ch) => chunkPublicationSlotId(ch) === sid)
        .map((ch) => ch.publication_article_chunk_id);
      const pubPage = slotPublicationPageBySlotId[sid];
      const publication_page =
        pubPage != null && Number.isFinite(pubPage) ? Math.round(Number(pubPage)) : null;
      return {
        index: index + 1,
        publication_slot_id: sid,
        publication_page,
        chunkIds,
      };
    });
  }, [publicationArticle, chunks, slotPublicationPageBySlotId]);

  const editorPageHref = useCallback(
    (slotId: number) =>
      publicationArticleEditorPageHref(idPublication, publicationArticleId, slotId),
    [idPublication, publicationArticleId]
  );

  const editorPageIndex = useMemo(() => {
    const { slotId } = parseArticleBuilderPageParam(editorPageParam);
    if (slotId == null) return -1;
    return pages.findIndex((p) => p.publication_slot_id === slotId);
  }, [editorPageParam, pages]);

  const navigateEditorPage = useCallback(
    (pageIndex: number) => {
      const p = pages[pageIndex];
      if (!p) return;
      replaceBuilderQuery((params) => {
        params.set("tab", "editor");
        params.set("page", formatArticleBuilderPageParam(p.publication_slot_id));
      });
    },
    [replaceBuilderQuery, pages]
  );

  useEffect(() => {
    if (mainTab !== "editor" || pages.length === 0) return;
    const { slotId } = parseArticleBuilderPageParam(editorPageParam);
    const hasValidPage = slotId != null && pages.some((p) => p.publication_slot_id === slotId);
    if (!hasValidPage) {
      navigateEditorPage(0);
    }
  }, [mainTab, editorPageParam, pages, navigateEditorPage]);

  const handleSyncPages = useCallback(async () => {
    if (!publicationArticle) return;
    const target = Math.max(1, Math.floor(Number(pageCountInput) || 1));
    setSyncing(true);
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}/sync-pages`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ desired_page_count: target }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to sync pages");
      }
      setActionMessage(`Pages synchronized to ${target}.`);
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to sync pages");
    } finally {
      setSyncing(false);
    }
  }, [publicationArticle, pageCountInput, publicationArticleId, load]);

  const handleInitializeChunks = useCallback(async () => {
    if (!publicationArticle) return;
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(
          publicationArticleId
        )}/initialize-chunks-from-source`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({}),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to initialize chunks from source");
      }
      const json = (await res.json()) as {
        initialized: boolean;
        created_count?: number;
        reason?: string;
      };
      setActionMessage(
        json.initialized
          ? `Imported ${json.created_count ?? 0} chunks from source article.`
          : `Nothing imported (${json.reason ?? "no source content"}).`
      );
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to initialize chunks from source");
    }
  }, [publicationArticle, publicationArticleId, load]);

  const handleAssignChunkToPage = useCallback(
    async (chunkId: string, slotId: number | null) => {
      setActionMessage(null);
      setActionError(null);
      setBusyChunkId(chunkId);
      try {
        const res = await fetch(`/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            publication_slot_id: slotId,
          }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to assign chunk to page");
        }
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to assign chunk to page");
      } finally {
        setBusyChunkId(null);
      }
    },
    [load]
  );

  const handleUpdateChunkPageWeight = useCallback(
    async (chunkId: string, weight: number) => {
      setActionMessage(null);
      setActionError(null);
      setBusyChunkId(chunkId);
      try {
        const w = Math.min(100, Math.max(1, Math.round(Number(weight))));
        const res = await fetch(`/api/v1/publication-article-chunks/${encodeURIComponent(chunkId)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ chunk_page_weight: w }),
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to update chunk weight");
        }
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to update chunk weight");
      } finally {
        setBusyChunkId(null);
      }
    },
    [load]
  );

  const handleMoveRestToNextSlot = useCallback(
    async (
      currentSlotId: number | null,
      nextSlotId: number,
      fromChunk: PublicationArticleChunk
    ) => {
      if (isTitleOrSubtitleChunkFormat(fromChunk.publication_article_chunk_format)) return;
      if (!Number.isInteger(nextSlotId) || nextSlotId <= 0) return;

      const pageChunksForMove = dedupeChunksForDisplay(
        chunks.filter((ch) => {
          if (currentSlotId == null) return chunkPublicationSlotId(ch) == null;
          return chunkPublicationSlotId(ch) === currentSlotId;
        })
      ).sort(
        (a, b) =>
          a.chunk_position - b.chunk_position ||
          a.publication_article_chunk_id.localeCompare(b.publication_article_chunk_id)
      );

      const startIdx = pageChunksForMove.findIndex(
        (c) => c.publication_article_chunk_id === fromChunk.publication_article_chunk_id
      );
      if (startIdx < 0) return;

      const toMove = pageChunksForMove
        .slice(startIdx)
        .filter((c) => !isTitleOrSubtitleChunkFormat(c.publication_article_chunk_format));
      if (toMove.length === 0) return;

      setActionMessage(null);
      setActionError(null);
      setBulkChunkMoveBusy(true);
      try {
        for (const ch of toMove) {
          const res = await fetch(
            `/api/v1/publication-article-chunks/${encodeURIComponent(ch.publication_article_chunk_id)}`,
            {
              method: "PATCH",
              headers: { "content-type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ publication_slot_id: nextSlotId }),
            }
          );
          if (!res.ok) {
            const txt = await res.text().catch(() => "");
            throw new Error(txt || "Failed to move chunk");
          }
        }
        setActionMessage(
          `Moved ${toMove.length} chunk${toMove.length === 1 ? "" : "s"} to the next page.`
        );
        await load();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to move chunks");
      } finally {
        setBulkChunkMoveBusy(false);
      }
    },
    [chunks, load]
  );

  const handleConfirmDeleteChunk = useCallback(async () => {
    const ch = deleteChunkModal;
    if (!ch) return;
    if (isTitleOrSubtitleChunkFormat(ch.publication_article_chunk_format)) return;
    setActionMessage(null);
    setActionError(null);
    setBusyChunkId(ch.publication_article_chunk_id);
    try {
      const res = await fetch(
        `/api/v1/publication-article-chunks/${encodeURIComponent(ch.publication_article_chunk_id)}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to delete chunk");
      }
      setActionMessage("Chunk deleted.");
      setDeleteChunkModal(null);
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to delete chunk");
    } finally {
      setBusyChunkId(null);
    }
  }, [deleteChunkModal, load]);

  const handleAddBlankChunk = useCallback(async () => {
    if (!publicationArticle) return;
    setActionMessage(null);
    setActionError(null);
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
            chunk_position: chunks.length,
          }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to add chunk");
      }
      await load();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Failed to add chunk");
    }
  }, [publicationArticle, publicationArticleId, chunks.length, load]);

  const handlePublicationArticleStateChange = useCallback(
    async (nextRaw: string) => {
      if (!publicationArticle) return;
      const next = isPublicationArticleStateValue(nextRaw) ? nextRaw : null;
      if (!next) return;
      const prev = String(publicationArticle.publication_article_state ?? "unfinished").trim();
      if (next === prev) return;
      setActionMessage(null);
      setActionError(null);
      setArticleStateSaving(true);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ publication_article_state: next }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to update workflow state");
        }
        const updated = (await res.json()) as PublicationArticleRow;
        setPublicationArticle((cur) =>
          cur ? { ...cur, publication_article_state: updated.publication_article_state } : cur
        );
        setActionMessage("Workflow state updated.");
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to update workflow state");
      } finally {
        setArticleStateSaving(false);
      }
    },
    [publicationArticle, publicationArticleId]
  );

  const handlePublicationArtNameSave = useCallback(
    async (nextRaw: string) => {
      if (!publicationArticle) return;
      const next = nextRaw.trim();
      const prev = String(publicationArticle.publication_art_name ?? "").trim();
      if (next === prev) return;
      setActionMessage(null);
      setActionError(null);
      setFlatplanNameSaving(true);
      try {
        const res = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
          {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ publication_art_name: next || "" }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to save flatplan name");
        }
        const updated = (await res.json()) as PublicationArticleRow;
        setPublicationArticle((cur) =>
          cur
            ? {
                ...cur,
                publication_art_name: updated.publication_art_name ?? null,
              }
            : cur
        );
        setActionMessage("Flatplan name saved.");
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to save flatplan name");
      } finally {
        setFlatplanNameSaving(false);
      }
    },
    [publicationArticle, publicationArticleId]
  );

  const portalArticleIdForOriginalTab = useMemo(() => {
    const aid = String(publicationArticle?.article_id ?? "").trim();
    if (!aid || aid.startsWith(STANDALONE_PUBLICATION_ARTICLE_PREFIX)) return null;
    return aid;
  }, [publicationArticle?.article_id]);

  const pageOptions = useMemo(() => {
    return pages.map((p) => ({
      index: p.index,
      publication_slot_id: p.publication_slot_id,
      publication_page: p.publication_page,
    }));
  }, [pages]);

  const articleFlowPages = useMemo(
    () =>
      buildArticleFlowPagesFromPublicationSlots(
        pages.map((p) => ({ publication_slot_id: p.publication_slot_id })),
        chunks
      ),
    [pages, chunks]
  );

  const chunksUnassigned = useMemo(
    () => dedupeChunksForDisplay(chunks.filter((ch) => chunkPublicationSlotId(ch) == null)),
    [chunks]
  );

  const unassignedWeightOverflowIds = useMemo(
    () => chunkPageOverflowIds(chunksUnassigned),
    [chunksUnassigned]
  );

  const canEditorPrev = useMemo(() => editorPageIndex > 0, [editorPageIndex]);
  const canEditorNext = useMemo(
    () => editorPageIndex >= 0 && editorPageIndex < pages.length - 1,
    [editorPageIndex, pages.length]
  );

  return {
    loading,
    error,
    publicationArticle,
    articleMeta,
    chunks,
    pages,
    pageOptions,
    articleFlowPages,
    chunksUnassigned,
    unassignedWeightOverflowIds,
    mainTab,
    generalSection,
    editorPageParam,
    editorPageIndex,
    canEditorPrev,
    canEditorNext,
    magazinePageLayout,
    pageCountInput,
    syncing,
    actionMessage,
    actionError,
    busyChunkId,
    bulkChunkMoveBusy,
    deleteChunkModal,
    setDeleteChunkModal,
    articleStateSaving,
    pageFormatSaving,
    pendingPageFormat,
    portalArticleIdForOriginalTab,
    setMainTab,
    setGeneralSection,
    navigateEditorPage,
    editorPageHref,
    load,
    requestPageFormatChange,
    confirmPageFormatChange,
    cancelPageFormatChange,
    handleSyncPages,
    handleInitializeChunks,
    handleAssignChunkToPage,
    handleUpdateChunkPageWeight,
    handleMoveRestToNextSlot,
    handleConfirmDeleteChunk,
    handleAddBlankChunk,
    handlePublicationArticleStateChange,
    handlePublicationArtNameSave,
    flatplanNameSaving,
    setPageCountInput,
    idPublication,
  };
}
