"use client";

import Link from "next/link";
import React, { FC, useEffect, useMemo, useState } from "react";
import { ArticleBuilderPagePreviewThumbnail } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleBuilderPagePreviewThumbnail";
import {
  publicationArticleEditorHref,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/articleBuilderNavigation";
import {
  buildArticleFlowPagesFromPublicationSlots,
  normalizeChunkFormat,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazineArticleColumnFlow";
import {
  DEFAULT_MAGAZINE_PAGE_LAYOUT,
  normalizeMagazinePageLayout,
  type MagazinePageLayout,
} from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/magazinePageLayout";
import type { PublicationArticleChunk } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/types";
import {
  flatplanArticleArtNameLine,
  flatplanArticlePageFractionLine,
} from "@/app/logged/pages/production/publications/publication_components/_shared";
import { chunkPublicationSlotId } from "@/app/logged/pages/production/publications/publication_components/publicationSlotIds";

type SlotArticlePreviewSectionProps = {
  publicationId: string;
  publicationArticleId: string;
  slotId: number;
  /** `publication_slots_db.publication_page` for the current slot (magazine spread). */
  currentMagazinePage: number | null;
  /**
   * Optional URL from the parent page load. Ignored for rendering — we always
   * refetch chunks and show a live preview so slot detail stays in sync with
   * the Article Builder after edits.
   */
  flatplanImageUrl?: string | null;
};

/** Format ordered magazine page numbers: `12`, `12–14`, or `12, 15, 18`. */
export function formatMagazinePagesInOrder(pages: (number | null)[]): string {
  const nums = pages
    .map((p) => (p != null && Number.isFinite(Number(p)) ? Math.round(Number(p)) : null))
    .filter((p): p is number => p != null);
  if (nums.length === 0) return "—";

  const parts: string[] = [];
  let runStart = nums[0]!;
  let runEnd = runStart;

  for (let i = 1; i < nums.length; i++) {
    const n = nums[i]!;
    if (n === runEnd + 1) {
      runEnd = n;
    } else {
      parts.push(runStart === runEnd ? String(runStart) : `${runStart}–${runEnd}`);
      runStart = n;
      runEnd = n;
    }
  }
  parts.push(runStart === runEnd ? String(runStart) : `${runStart}–${runEnd}`);
  return parts.join(", ");
}

export const SlotArticlePreviewSection: FC<SlotArticlePreviewSectionProps> = ({
  publicationId,
  publicationArticleId,
  slotId,
  currentMagazinePage,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<PublicationArticleChunk[]>([]);
  const [slotIdsOrdered, setSlotIdsOrdered] = useState<number[]>([]);
  const [magazinePageBySlotId, setMagazinePageBySlotId] = useState<Record<number, number | null>>({});
  const [magazinePageLayout, setMagazinePageLayout] = useState<MagazinePageLayout>(
    DEFAULT_MAGAZINE_PAGE_LAYOUT
  );
  const [publicationArtName, setPublicationArtName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const paRes = await fetch(
          `/api/v1/publication-articles/${encodeURIComponent(publicationArticleId)}?ensure_slot_id=${encodeURIComponent(String(slotId))}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!paRes.ok) {
          const txt = await paRes.text().catch(() => "");
          throw new Error(txt || "Failed to load publication article");
        }
        const json = (await paRes.json()) as {
          publication_article?: {
            publication_slots_id_array?: number[];
            publication_art_name?: string | null;
          };
          chunks?: PublicationArticleChunk[];
          magazine_page_layout?: MagazinePageLayout;
        };
        const ordered = Array.isArray(json.publication_article?.publication_slots_id_array)
          ? json.publication_article.publication_slots_id_array
              .map(Number)
              .filter((n) => Number.isFinite(n) && n > 0)
          : [];
        if (cancelled) return;

        setChunks(Array.isArray(json.chunks) ? json.chunks : []);
        setSlotIdsOrdered(ordered);
        const artName = json.publication_article?.publication_art_name;
        setPublicationArtName(
          artName != null && String(artName).trim() !== "" ? String(artName).trim() : null
        );
        setMagazinePageLayout(
          json.magazine_page_layout != null
            ? normalizeMagazinePageLayout(json.magazine_page_layout)
            : DEFAULT_MAGAZINE_PAGE_LAYOUT
        );

        const pageBySlot: Record<number, number | null> = {};
        await Promise.all(
          ordered.map(async (sid) => {
            try {
              const sr = await fetch(`/api/v1/publication-slots/${encodeURIComponent(String(sid))}`, {
                cache: "no-store",
                credentials: "include",
              });
              if (!sr.ok) {
                pageBySlot[sid] = null;
                return;
              }
              const row = (await sr.json()) as { publication_page?: number | null };
              const pp = row?.publication_page;
              pageBySlot[sid] =
                pp != null && Number.isFinite(Number(pp)) ? Math.round(Number(pp)) : null;
            } catch {
              pageBySlot[sid] = null;
            }
          })
        );
        if (!cancelled) setMagazinePageBySlotId(pageBySlot);
      } catch (e: unknown) {
        if (!cancelled) {
          setChunks([]);
          setSlotIdsOrdered([]);
          setMagazinePageBySlotId({});
          setPublicationArtName(null);
          setError(e instanceof Error ? e.message : "Failed to load article preview");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicationArticleId, slotId]);

  const articlePageIndex = useMemo(() => {
    const idx = slotIdsOrdered.findIndex((id) => id === slotId);
    return idx >= 0 ? idx + 1 : 0;
  }, [slotIdsOrdered, slotId]);

  const totalArticlePages = slotIdsOrdered.length;

  const magazinePagesInOrder = useMemo(
    () => slotIdsOrdered.map((sid) => magazinePageBySlotId[sid] ?? null),
    [slotIdsOrdered, magazinePageBySlotId]
  );

  const magazinePagesLabel = useMemo(
    () => formatMagazinePagesInOrder(magazinePagesInOrder),
    [magazinePagesInOrder]
  );

  const pageChunks = useMemo(
    () => chunks.filter((c) => chunkPublicationSlotId(c) === slotId),
    [chunks, slotId]
  );

  const articleFlowPages = useMemo(
    () =>
      buildArticleFlowPagesFromPublicationSlots(
        slotIdsOrdered.map((publication_slot_id) => ({ publication_slot_id })),
        chunks
      ),
    [slotIdsOrdered, chunks]
  );

  const publicationPageForSlot = useMemo(() => {
    if (currentMagazinePage != null && Number.isFinite(Number(currentMagazinePage))) {
      return Math.round(Number(currentMagazinePage));
    }
    const mp = magazinePageBySlotId[slotId];
    return mp != null && Number.isFinite(mp) ? mp : null;
  }, [currentMagazinePage, magazinePageBySlotId, slotId]);

  const isLeftPage = useMemo(() => {
    if (publicationPageForSlot != null) {
      return publicationPageForSlot % 2 === 0;
    }
    return articlePageIndex > 0 && articlePageIndex % 2 === 0;
  }, [publicationPageForSlot, articlePageIndex]);

  const articleHeadingHtml = useMemo(() => {
    const firstSlotId = slotIdsOrdered[0];
    if (!firstSlotId) {
      return { title: null as string | null, subtitle: null as string | null };
    }
    const firstPageChunks = chunks.filter(
      (c) => chunkPublicationSlotId(c) === firstSlotId
    );
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
  }, [chunks, slotIdsOrdered]);

  const editorHref = publicationArticleEditorHref(publicationId, publicationArticleId);

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
        Loading article preview…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-900 space-y-3">
        <p>{error}</p>
        <Link
          href={editorHref}
          className="inline-flex px-5 py-2.5 rounded-xl bg-blue-950 text-white font-semibold text-sm hover:bg-blue-900"
        >
          Open article builder
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 flex flex-col items-center gap-4">
      <div className="w-full max-w-md aspect-[228/297] overflow-hidden rounded-sm border border-gray-200 bg-white shadow-inner">
        {pageChunks.length > 0 ? (
          <ArticleBuilderPagePreviewThumbnail
            chunks={pageChunks}
            pageIndex={articlePageIndex > 0 ? articlePageIndex : 1}
            isLeftPage={isLeftPage}
            publicationPage={publicationPageForSlot}
            pageFormat={magazinePageLayout}
            articleFlowPages={articleFlowPages}
            currentSlotContentId={slotId}
            articleTitleHtml={articleHeadingHtml.title}
            articleSubtitleHtml={articleHeadingHtml.subtitle}
            editable={false}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-gray-100 p-4 text-center">
            <p className="text-xs text-gray-600">
              No content chunks on this page yet. Open the Article Builder to add text and images.
            </p>
            <Link
              href={editorHref}
              className="rounded-lg bg-blue-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900"
            >
              Open Article Builder (editor)
            </Link>
          </div>
        )}
      </div>

      <div className="w-full max-w-md space-y-2 text-center text-sm text-gray-700">
        {totalArticlePages > 0 && articlePageIndex > 0 ? (
          <>
            <p className="font-semibold text-gray-900">
              This spread is article page{" "}
              <span className="font-mono tabular-nums">
                {articlePageIndex}/{totalArticlePages}
              </span>
            </p>
            {flatplanArticleArtNameLine(publicationArtName) ? (
              <p className="inline-block rounded-sm bg-gradient-to-r from-zinc-950 to-indigo-950 px-2 py-1 text-xs font-medium text-white">
                {flatplanArticleArtNameLine(publicationArtName)}
              </p>
            ) : null}
            <p className="inline-block rounded-sm bg-gradient-to-r from-zinc-950 to-indigo-950 px-2 py-1 text-xs font-medium text-white">
              {flatplanArticlePageFractionLine(articlePageIndex, totalArticlePages)}
            </p>
            {!publicationArtName ? (
              <p className="text-[11px] text-gray-500">
                Set <span className="font-medium">Publication Article Flatplan Name</span> in the
                Article Builder to label this tile on the flatplan.
              </p>
            ) : null}
            <p className="text-[11px] text-gray-500">
              Preview is loaded live from saved chunks. In the Article Builder editor, use
              <span className="font-medium"> Guardar cambios</span> to persist text and refresh
              flatplan screenshots.
            </p>
          </>
        ) : totalArticlePages > 0 ? (
          <p className="font-semibold text-amber-900">
            This slot is linked to the article, but it is not one of its magazine pages in the
            flatplan
            {currentMagazinePage != null ? (
              <>
                {" "}
                (magazine page{" "}
                <span className="font-mono tabular-nums">{currentMagazinePage}</span>)
              </>
            ) : null}
            . Open the Article Builder to assign this slot to a page, or remove the article from
            this slot if pages{" "}
            <span className="font-mono tabular-nums">{magazinePagesLabel}</span> are correct.
          </p>
        ) : (
          <p className="font-semibold text-amber-900">
            This slot is not listed in the article&apos;s page order yet. Sync pages in the Article
            Builder.
          </p>
        )}

        <p className="text-xs text-gray-600">
          Pages this article occupies in the issue (flatplan order):{" "}
          <span className="font-medium text-gray-800 font-mono">{magazinePagesLabel}</span>
        </p>
      </div>

      <Link
        href={editorHref}
        className="px-5 py-2.5 rounded-xl bg-blue-950 text-white font-semibold text-sm hover:bg-blue-900"
      >
        Open article builder
      </Link>
    </div>
  );
};
