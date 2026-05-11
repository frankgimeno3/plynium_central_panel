"use client";

import React, { FC, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ArticleSubpageActionAlerts } from "./subpage_page_components/ArticleSubpageActionAlerts";
import { ArticleSubpageChunksSection } from "./subpage_page_components/ArticleSubpageChunksSection";
import { ArticleSubpageHeader } from "./subpage_page_components/ArticleSubpageHeader";
import { ArticleSubpagePageFormatSection } from "./subpage_page_components/ArticleSubpagePageFormatSection";
import {
  articleBuilderHref,
  ChunkFormat,
  parseSubpageId,
  PublicationArticleChunk,
  PublicationArticleRow,
} from "./subpage_page_components/types";

export const ArticleSubpagePageContent: FC = () => {
  const searchParams = useSearchParams();
  const id_publication = searchParams.get("issue") ?? "";
  const publicationArticleId = searchParams.get("item") ?? "";
  const article_subpage_id = searchParams.get("page") ?? "";
  const { setPageMeta } = usePageContent();

  const { slotId, slotContentId: parsedSlotContentId } = useMemo(
    () => parseSubpageId(article_subpage_id),
    [article_subpage_id]
  );

  const [publicationArticle, setPublicationArticle] = useState<PublicationArticleRow | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingChunkId, setSavingChunkId] = useState<string | null>(null);
  const [pageFormatDraft, setPageFormatDraft] = useState<string>("only_text");

  const loadAll = useCallback(async () => {
    if (!publicationArticleId) {
      setPublicationArticle(null);
      setChunks([]);
      setError("Missing publication article id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const paRes = await fetch(
        `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}`,
        { cache: "no-store", credentials: "include" }
      );
      if (!paRes.ok) {
        const txt = await paRes.text().catch(() => "");
        throw new Error(txt || "Failed to load publication_article");
      }
      const paJson = (await paRes.json()) as {
        publication_article: PublicationArticleRow;
        chunks: PublicationArticleChunk[];
      };
      setPublicationArticle(paJson?.publication_article ?? null);
      setChunks(Array.isArray(paJson?.chunks) ? paJson.chunks : []);
    } catch (e: unknown) {
      setPublicationArticle(null);
      setChunks([]);
      setError(e instanceof Error ? e.message : "Failed to load subpage");
    } finally {
      setLoading(false);
    }
  }, [publicationArticleId]);

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
                href: `/logged/pages/production/publications/${encodeURIComponent(id_publication)}`,
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
    if (!parsedSlotContentId) return [];
    return chunks
      .filter((c) => Number(c.publication_slot_content_id) === parsedSlotContentId)
      .slice()
      .sort((a, b) => a.chunk_position - b.chunk_position);
  }, [chunks, parsedSlotContentId]);

  const allPages = useMemo(() => {
    return Array.isArray(publicationArticle?.publication_slots_id_array)
      ? publicationArticle.publication_slots_id_array.map((sid, index) => ({
          index: index + 1,
          publication_slot_id: Number(sid),
        }))
      : [];
  }, [publicationArticle]);

  const updateChunk = useCallback(
    async (chunkId: string, payload: Partial<PublicationArticleChunk>) => {
      setActionError(null);
      setActionMessage(null);
      setSavingChunkId(chunkId);
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
        await loadAll();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to update chunk");
      } finally {
        setSavingChunkId(null);
      }
    },
    [loadAll]
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
        await loadAll();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to delete chunk");
      }
    },
    [loadAll]
  );

  const addChunkAtPosition = useCallback(
    async (position: number) => {
      if (!publicationArticle || !parsedSlotContentId) return;
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
              publication_slot_content_id: parsedSlotContentId,
            }),
          }
        );
        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(txt || "Failed to add chunk");
        }
        await loadAll();
      } catch (e: unknown) {
        setActionError(e instanceof Error ? e.message : "Failed to add chunk");
      }
    },
    [publicationArticle, parsedSlotContentId, publicationArticleId, loadAll]
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

  const handleHtmlChange = useCallback((chunkId: string, html: string) => {
    setChunks((prev) =>
      prev.map((chunk) =>
        chunk.publication_article_chunk_id === chunkId ? { ...chunk, chunk_html: html } : chunk
      )
    );
  }, []);

  const handleFormatChange = useCallback(
    (chunkId: string, format: ChunkFormat) => {
      void updateChunk(chunkId, { publication_article_chunk_format: format });
    },
    [updateChunk]
  );

  const handleSlotContentChange = useCallback(
    (chunkId: string, slotContentId: number | null) => {
      void updateChunk(chunkId, { publication_slot_content_id: slotContentId });
    },
    [updateChunk]
  );

  const handleHtmlBlur = useCallback(
    (chunkId: string, html: string) => {
      void updateChunk(chunkId, { chunk_html: html });
    },
    [updateChunk]
  );

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

  const pageIndex =
    publicationArticle.publication_slots_id_array.findIndex(
      (sid) => Number(sid) === Number(slotId)
    ) + 1;

  return (
    <PageContentSection>
      <div className="space-y-6 p-4">
        <ArticleSubpageHeader
          articleId={publicationArticle.article_id}
          slotId={slotId}
          pageIndex={pageIndex}
        />

        <ArticleSubpageActionAlerts actionError={actionError} actionMessage={actionMessage} />

        <ArticleSubpagePageFormatSection
          pageFormatDraft={pageFormatDraft}
          onPageFormatChange={setPageFormatDraft}
        />

        <ArticleSubpageChunksSection
          parsedSlotContentId={parsedSlotContentId}
          subpageChunks={subpageChunks}
          slotId={slotId}
          allPages={allPages}
          savingChunkId={savingChunkId}
          onAddChunk={() => void addChunkAtPosition(subpageChunks.length)}
          onFormatChange={handleFormatChange}
          onMoveUp={(chunkId) => void moveChunkBy(chunkId, -1)}
          onMoveDown={(chunkId) => void moveChunkBy(chunkId, 1)}
          onSlotContentChange={handleSlotContentChange}
          onDelete={(chunkId) => void removeChunk(chunkId)}
          onHtmlChange={handleHtmlChange}
          onHtmlBlur={handleHtmlBlur}
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
