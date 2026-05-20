"use client";

import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import { isPublicationArticleStateValue } from "../../../../../../publication_components/_shared";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ArticleBuilderTab } from "../../articleBuilderNavigation";
import { buildArticleFlowPagesFromPublicationSlots } from "../../magazineArticleColumnFlow";
import {
  DEFAULT_MAGAZINE_PAGE_LAYOUT,
  normalizeMagazinePageLayout,
  type MagazinePageLayout,
} from "../../magazinePageLayout";
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

  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [articleStateSaving, setArticleStateSaving] = useState(false);
  const [flatplanNameSaving, setFlatplanNameSaving] = useState(false);
  const [addingPage, setAddingPage] = useState(false);
  const [addPageModalOpen, setAddPageModalOpen] = useState(false);
  const [addPageError, setAddPageError] = useState<string | null>(null);
  const [pendingDeleteSlotId, setPendingDeleteSlotId] = useState<number | null>(null);
  const [deletingPage, setDeletingPage] = useState(false);
  const [deletePageError, setDeletePageError] = useState<string | null>(null);
  const [magazinePageLayout, setMagazinePageLayout] = useState<MagazinePageLayout>(
    DEFAULT_MAGAZINE_PAGE_LAYOUT
  );
  const [pageFormatSaving, setPageFormatSaving] = useState(false);
  const [pendingPageFormat, setPendingPageFormat] = useState<MagazinePageLayout | null>(null);

  const mainTab: ArticleBuilderTab =
    searchParams.get("tab") === "editor" ? "editor" : "general";

  const setMainTab = useCallback(
    (tab: ArticleBuilderTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "general") {
        params.delete("tab");
      } else {
        params.set("tab", "editor");
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
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

  const load = useCallback(async (options?: { silent?: boolean }) => {
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
              const sr = await fetch(
                `/api/v1/publication-slots/${encodeURIComponent(String(sid))}`,
                { cache: "no-store", credentials: "include" }
              );
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
  }, [publicationArticleId]);

  useEffect(() => {
    void load();
  }, [load]);

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
    return arr
      .map((slotId) => Number(slotId))
      .filter((sid) => Number.isFinite(sid) && sid > 0)
      .map((publication_slot_id) => ({ publication_slot_id }));
  }, [publicationArticle]);

  const articleFlowPages = useMemo(
    () =>
      buildArticleFlowPagesFromPublicationSlots(
        pages.map((p) => ({ publication_slot_id: p.publication_slot_id })),
        chunks
      ),
    [pages, chunks]
  );

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

  const requestAddArticlePage = useCallback(() => {
    if (addingPage) return;
    setAddPageError(null);
    setAddPageModalOpen(true);
  }, [addingPage]);

  const cancelAddArticlePage = useCallback(() => {
    if (addingPage) return;
    setAddPageModalOpen(false);
    setAddPageError(null);
  }, [addingPage]);

  const confirmAddArticlePage = useCallback(async () => {
    if (!publicationArticle) return;
    const currentCount = Array.isArray(publicationArticle.publication_slots_id_array)
      ? publicationArticle.publication_slots_id_array.length
      : 0;
    const target = Math.max(1, currentCount + 1);
    setActionMessage(null);
    setActionError(null);
    setAddPageError(null);
    setAddingPage(true);
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
        throw new Error(txt || "Failed to add article page");
      }
      setActionMessage(`Article page ${target} added.`);
      setAddPageModalOpen(false);
      await load({ silent: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to add article page";
      setAddPageError(msg);
      setActionError(msg);
    } finally {
      setAddingPage(false);
    }
  }, [publicationArticle, publicationArticleId, load]);

  const requestDeleteArticlePage = useCallback(
    (slotId: number) => {
      if (deletingPage) return;
      const sid = Number(slotId);
      if (!Number.isFinite(sid) || sid <= 0) return;
      setDeletePageError(null);
      setPendingDeleteSlotId(sid);
    },
    [deletingPage]
  );

  const cancelDeleteArticlePage = useCallback(() => {
    if (deletingPage) return;
    setPendingDeleteSlotId(null);
    setDeletePageError(null);
  }, [deletingPage]);

  const confirmDeleteArticlePage = useCallback(async () => {
    if (pendingDeleteSlotId == null) return;
    const slotId = pendingDeleteSlotId;
    setActionMessage(null);
    setActionError(null);
    setDeletePageError(null);
    setDeletingPage(true);
    try {
      const res = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(
          publicationArticleId
        )}/pages/${encodeURIComponent(String(slotId))}?delete_chunks=1`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to delete article page");
      }
      let deletedChunkCount = 0;
      try {
        const json = (await res.json()) as { deleted_chunk_count?: number };
        if (json && typeof json.deleted_chunk_count === "number") {
          deletedChunkCount = json.deleted_chunk_count;
        }
      } catch {
        /* ignore */
      }
      setActionMessage(
        deletedChunkCount > 0
          ? `Page deleted (${deletedChunkCount} chunk${
              deletedChunkCount === 1 ? "" : "s"
            } removed).`
          : "Page deleted."
      );
      setPendingDeleteSlotId(null);
      await load({ silent: true });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to delete article page";
      setDeletePageError(msg);
      setActionError(msg);
    } finally {
      setDeletingPage(false);
    }
  }, [pendingDeleteSlotId, publicationArticleId, load]);

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

  return {
    loading,
    error,
    publicationArticle,
    articleMeta,
    chunks,
    setChunks,
    pages,
    articleFlowPages,
    slotPublicationPageBySlotId,
    mainTab,
    magazinePageLayout,
    actionMessage,
    actionError,
    setActionMessage,
    setActionError,
    articleStateSaving,
    pageFormatSaving,
    pendingPageFormat,
    addingPage,
    addPageModalOpen,
    addPageError,
    pendingDeleteSlotId,
    deletingPage,
    deletePageError,
    setMainTab,
    load,
    requestPageFormatChange,
    confirmPageFormatChange,
    cancelPageFormatChange,
    handlePublicationArticleStateChange,
    handlePublicationArtNameSave,
    requestAddArticlePage,
    confirmAddArticlePage,
    cancelAddArticlePage,
    requestDeleteArticlePage,
    confirmDeleteArticlePage,
    cancelDeleteArticlePage,
    flatplanNameSaving,
    idPublication,
  };
}
