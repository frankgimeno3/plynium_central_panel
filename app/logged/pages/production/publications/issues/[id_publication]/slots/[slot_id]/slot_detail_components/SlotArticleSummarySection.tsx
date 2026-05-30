"use client";

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { ArticleSlotFlatplanThumbnail } from "@/app/logged/pages/production/publications/issues/[id_publication]/article_builder/article_builder_components/article_builder_page/components/ArticleSlotFlatplanThumbnail";
import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import { formatAdvertSlotPageDisplay } from "@/lib/publication/advertiserIndexHtml";
import {
  buildArticleSummaryHtml,
  collectArticleSlotsForSummaryListing,
  defaultArticleSummaryEntryTitle,
  isArticleSummaryHtml,
  mergeArticleRowsWithDisplayTitles,
  parseArticleTitlesFromSummaryHtml,
  resolveArticleSummaryTitleFromParsed,
  type ArticleSummaryHtmlOptions,
  type ArticleSummarySourceRow,
} from "@/lib/publication/articleSummaryHtml";

const ISSUES_BASE = "/logged/pages/production/publications/issues";

const PRIMARY_BUTTON_CLASS =
  "inline-flex rounded-lg bg-blue-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50";

function buildTitlesMapFromSavedOrDefaults(
  rows: readonly ArticleSummarySourceRow[],
  savedLayoutHtml: string
): Record<string, string> {
  const defaults = buildDefaultTitlesMap(rows);
  if (!isArticleSummaryHtml(savedLayoutHtml)) return defaults;
  const parsed = parseArticleTitlesFromSummaryHtml(savedLayoutHtml);
  const merged: Record<string, string> = { ...defaults };
  for (const row of rows) {
    const saved = resolveArticleSummaryTitleFromParsed(row, parsed);
    if (saved !== undefined) merged[row.summary_entry_id] = saved;
  }
  return merged;
}

function buildDefaultTitlesMap(rows: readonly ArticleSummarySourceRow[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.summary_entry_id] = defaultArticleSummaryEntryTitle(row);
  }
  return map;
}

export type SlotArticleSummarySectionProps = {
  publicationId: string;
  summarySlotId: number;
  magazineOptions: ArticleSummaryHtmlOptions;
  savedLayoutHtml: string;
  onSavedLayoutChange: (html: string) => void;
};

export const SlotArticleSummarySection: FC<SlotArticleSummarySectionProps> = ({
  publicationId,
  summarySlotId,
  magazineOptions,
  savedLayoutHtml,
  onSavedLayoutChange,
}) => {
  const [allSlots, setAllSlots] = useState<SlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [rebuildBusy, setRebuildBusy] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  const [draftTitlesByEntryId, setDraftTitlesByEntryId] = useState<Record<string, string>>({});
  const [committedTitlesByEntryId, setCommittedTitlesByEntryId] = useState<Record<string, string>>(
    {}
  );
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const initializedRowsKeyRef = useRef<string | null>(null);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load publication slots");
      const data = (await res.json()) as SlotRow[];
      setAllSlots(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      setAllSlots([]);
      setSlotsError((e as Error)?.message ?? "Failed to load slots");
    } finally {
      setSlotsLoading(false);
    }
  }, [publicationId]);

  useEffect(() => {
    void loadSlots();
  }, [loadSlots]);

  const articleRows = useMemo(() => collectArticleSlotsForSummaryListing(allSlots), [allSlots]);

  const articleRowIdsKey = useMemo(
    () => articleRows.map((r) => r.summary_entry_id).join(","),
    [articleRows]
  );

  useEffect(() => {
    if (!articleRowIdsKey) {
      setDraftTitlesByEntryId({});
      setCommittedTitlesByEntryId({});
      initializedRowsKeyRef.current = null;
      return;
    }
    if (initializedRowsKeyRef.current === articleRowIdsKey) return;

    const map = buildTitlesMapFromSavedOrDefaults(articleRows, savedLayoutHtml);
    setDraftTitlesByEntryId(map);
    setCommittedTitlesByEntryId(map);
    initializedRowsKeyRef.current = articleRowIdsKey;
  }, [articleRowIdsKey, articleRows, savedLayoutHtml]);

  const previewHtml = useMemo(
    () =>
      buildArticleSummaryHtml(
        mergeArticleRowsWithDisplayTitles(articleRows, committedTitlesByEntryId),
        magazineOptions
      ),
    [articleRows, committedTitlesByEntryId, magazineOptions]
  );

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (el.innerHTML !== previewHtml) {
      el.innerHTML = previewHtml;
    }
  }, [previewHtml]);

  const persistHtml = useCallback(
    async (html: string) => {
      const res = await fetch(`/api/v1/publication-slots/${summarySlotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ magazine_page_layout: html }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to save summary HTML");
      }
      onSavedLayoutChange(html);
    },
    [summarySlotId, onSavedLayoutChange]
  );

  const handleDraftChange = useCallback((entryId: string, value: string) => {
    setDraftTitlesByEntryId((prev) => ({ ...prev, [entryId]: value }));
  }, []);

  const handleSaveArticleTitle = useCallback(
    async (entryId: string) => {
      const row = articleRows.find((r) => r.summary_entry_id === entryId);
      const title = String(
        draftTitlesByEntryId[entryId] ?? (row ? defaultArticleSummaryEntryTitle(row) : "")
      ).trim();

      setSaveError(null);
      setSavingEntryId(entryId);
      try {
        const nextCommitted = { ...committedTitlesByEntryId, [entryId]: title };
        setCommittedTitlesByEntryId(nextCommitted);
        const html = buildArticleSummaryHtml(
          mergeArticleRowsWithDisplayTitles(articleRows, nextCommitted),
          magazineOptions
        );
        await persistHtml(html);
        setDraftTitlesByEntryId((prev) => ({ ...prev, [entryId]: title }));
      } catch (e: unknown) {
        setSaveError((e as Error)?.message ?? "Failed to save");
      } finally {
        setSavingEntryId(null);
      }
    },
    [
      articleRows,
      committedTitlesByEntryId,
      draftTitlesByEntryId,
      magazineOptions,
      persistHtml,
    ]
  );

  const handleUpdateWithCurrentData = useCallback(async () => {
    setRebuildError(null);
    setRebuildBusy(true);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots/${summarySlotId}/rebuild-article-summary`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        magazine_page_layout?: string;
      };
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      const html = String(data.magazine_page_layout ?? "");
      const map = buildTitlesMapFromSavedOrDefaults(articleRows, html);
      setDraftTitlesByEntryId(map);
      setCommittedTitlesByEntryId(map);
      onSavedLayoutChange(html);
      await loadSlots();
    } catch (e: unknown) {
      setRebuildError((e as Error)?.message ?? "Failed to rebuild summary");
    } finally {
      setRebuildBusy(false);
    }
  }, [publicationId, summarySlotId, onSavedLayoutChange, loadSlots, articleRows]);

  const resetDraftAndPreviewToListing = useCallback(() => {
    const map = buildDefaultTitlesMap(articleRows);
    setDraftTitlesByEntryId(map);
    setCommittedTitlesByEntryId(map);
  }, [articleRows]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-800">Article summary</p>
        <button
          type="button"
          onClick={() => void handleUpdateWithCurrentData()}
          disabled={rebuildBusy || slotsLoading}
          className={PRIMARY_BUTTON_CLASS}
        >
          {rebuildBusy ? "Updating…" : "Update with current data"}
        </button>
      </div>

      {rebuildError ? (
        <p className="text-xs text-red-600" role="alert">
          {rebuildError}
        </p>
      ) : null}
      {saveError ? (
        <p className="text-xs text-red-600" role="alert">
          {saveError}
        </p>
      ) : null}
      {slotsError ? (
        <p className="text-xs text-amber-800" role="alert">
          {slotsError}
        </p>
      ) : null}

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Article slots in this issue ({articleRows.length})
        </p>
        {slotsLoading ? (
          <p className="text-sm text-gray-500">Loading article slots…</p>
        ) : articleRows.length === 0 ? (
          <p className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
            No article slots found. Assign articles in the flatplan, then use{" "}
            <strong>Update with current data</strong>.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 max-w-2xl">
            {articleRows.map((row) => {
              const entryId = row.summary_entry_id;
              const draftValue =
                draftTitlesByEntryId[entryId] ?? defaultArticleSummaryEntryTitle(row);
              const committedValue =
                committedTitlesByEntryId[entryId] ?? defaultArticleSummaryEntryTitle(row);
              const isDirty = draftValue.trim() !== committedValue.trim();
              const pageLabels = row.publication_pages.map((p) =>
                formatAdvertSlotPageDisplay(p.publication_page, p.slot_key)
              );
              const flatplanUrl = String(row.slot_flatplan_image_url ?? "").trim();
              const rowSaving = savingEntryId === entryId;
              return (
                <li
                  key={entryId}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-blue-200 transition"
                >
                  <div className="flex flex-row items-stretch gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                        <label className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">
                            Article title
                          </span>
                          <div className="mt-0.5 flex gap-2">
                            <input
                              type="text"
                              value={draftValue}
                              onChange={(e) => handleDraftChange(entryId, e.target.value)}
                              placeholder="—"
                              className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSaveArticleTitle(entryId)}
                              disabled={rowSaving || slotsLoading || !isDirty}
                              className={`shrink-0 ${PRIMARY_BUTTON_CLASS}`}
                            >
                              {rowSaving ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </label>
                        <p className="shrink-0 pb-1.5 text-xs text-gray-600 sm:text-right">
                          <span className="text-gray-500">
                            {row.publication_pages.length > 1 ? "Article pages: " : "Article page: "}
                          </span>
                          <span className="font-semibold text-gray-900">{pageLabels.join(", ")}</span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {row.publication_pages.map((p) => (
                          <Link
                            key={p.publication_slot_id}
                            href={`${ISSUES_BASE}/${encodeURIComponent(publicationId)}/slots/${p.publication_slot_id}`}
                            className={PRIMARY_BUTTON_CLASS}
                          >
                            Go to page {formatAdvertSlotPageDisplay(p.publication_page, p.slot_key)}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div
                      className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                      aria-hidden={!flatplanUrl}
                    >
                      {flatplanUrl ? (
                        <ArticleSlotFlatplanThumbnail
                          imageUrl={flatplanUrl}
                          className="absolute inset-0 h-full w-full object-contain opacity-100"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[9px] leading-tight text-gray-400">
                          No capture
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={resetDraftAndPreviewToListing}
            disabled={slotsLoading || savingEntryId != null}
            className={PRIMARY_BUTTON_CLASS}
          >
            Reset preview to flatplan titles
          </button>
        </div>
      </section>

      <section className="space-y-3 border-t border-gray-200 pt-6">
        <p className="text-xs uppercase tracking-wide text-gray-500">Page preview</p>
        <p className="text-xs text-gray-500">
          Edit a title and click <span className="font-medium">Save</span> on that row to update
          the preview below and persist to <span className="font-mono">magazine_page_layout</span>.
        </p>
        <div
          className="mx-auto w-full max-w-md overflow-hidden rounded-sm shadow-xl ring-1 ring-black/10"
          style={{ aspectRatio: "228 / 297" }}
        >
          <div
            ref={previewRef}
            className="h-full w-full overflow-hidden text-left pointer-events-none"
            aria-label="Article summary page preview"
          />
        </div>
      </section>
    </div>
  );
};
