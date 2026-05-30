"use client";

import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { FlatplanAdvertMediaThumbnail } from "@/app/logged/pages/production/publications/issues/[id_publication]/_tabs/FlatplanTab/flatplan_tab_components/FlatplanAdvertMediaThumbnail";
import type { SlotRow } from "@/app/logged/pages/production/publications/publication_components/_shared";
import {
  buildAdvertiserIndexHtml,
  collectAdvertSlotsForIndexListing,
  defaultAdvertIndexEntryName,
  formatAdvertSlotPageDisplay,
  isAdvertiserIndexHtml,
  mergeAdvertRowsWithDisplayNames,
  parseAdvertNamesFromIndexHtml,
  type AdvertiserIndexHtmlOptions,
} from "@/lib/publication/advertiserIndexHtml";

const ISSUES_BASE = "/logged/pages/production/publications/issues";

const PRIMARY_BUTTON_CLASS =
  "inline-flex rounded-lg bg-blue-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-50";

function buildNamesMapFromSavedOrDefaults(
  rows: ReturnType<typeof collectAdvertSlotsForIndexListing>,
  savedLayoutHtml: string
): Record<number, string> {
  const defaults = buildDefaultNamesMap(rows);
  if (!isAdvertiserIndexHtml(savedLayoutHtml)) return defaults;
  const parsed = parseAdvertNamesFromIndexHtml(savedLayoutHtml);
  const merged: Record<number, string> = { ...defaults };
  for (const row of rows) {
    const id = row.publication_slot_id;
    if (parsed[id] !== undefined) merged[id] = parsed[id];
  }
  return merged;
}

function buildDefaultNamesMap(
  rows: ReturnType<typeof collectAdvertSlotsForIndexListing>
): Record<number, string> {
  const map: Record<number, string> = {};
  for (const row of rows) {
    map[row.publication_slot_id] = defaultAdvertIndexEntryName(row);
  }
  return map;
}

export type SlotAdvertiserIndexSectionProps = {
  publicationId: string;
  indexSlotId: number;
  magazineOptions: AdvertiserIndexHtmlOptions;
  savedLayoutHtml: string;
  onSavedLayoutChange: (html: string) => void;
};

export const SlotAdvertiserIndexSection: FC<SlotAdvertiserIndexSectionProps> = ({
  publicationId,
  indexSlotId,
  magazineOptions,
  savedLayoutHtml,
  onSavedLayoutChange,
}) => {
  const [allSlots, setAllSlots] = useState<SlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [rebuildBusy, setRebuildBusy] = useState(false);
  const [rebuildError, setRebuildError] = useState<string | null>(null);
  /** Input values (editable drafts; not tied to preview until Save). */
  const [draftNamesBySlotId, setDraftNamesBySlotId] = useState<Record<number, string>>({});
  /** Names reflected in Page preview and persisted HTML. */
  const [committedNamesBySlotId, setCommittedNamesBySlotId] = useState<Record<number, string>>({});
  const [savingSlotId, setSavingSlotId] = useState<number | null>(null);
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

  const advertRows = useMemo(() => collectAdvertSlotsForIndexListing(allSlots), [allSlots]);

  const advertRowIdsKey = useMemo(
    () => advertRows.map((r) => r.publication_slot_id).join(","),
    [advertRows]
  );

  useEffect(() => {
    if (!advertRowIdsKey) {
      setDraftNamesBySlotId({});
      setCommittedNamesBySlotId({});
      initializedRowsKeyRef.current = null;
      return;
    }
    if (initializedRowsKeyRef.current === advertRowIdsKey) return;

    const map = buildNamesMapFromSavedOrDefaults(advertRows, savedLayoutHtml);
    setDraftNamesBySlotId(map);
    setCommittedNamesBySlotId(map);
    initializedRowsKeyRef.current = advertRowIdsKey;
  }, [advertRowIdsKey, advertRows, savedLayoutHtml]);

  const previewHtml = useMemo(
    () =>
      buildAdvertiserIndexHtml(
        mergeAdvertRowsWithDisplayNames(advertRows, committedNamesBySlotId),
        magazineOptions
      ),
    [advertRows, committedNamesBySlotId, magazineOptions]
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
      const res = await fetch(`/api/v1/publication-slots/${indexSlotId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ magazine_page_layout: html }),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Failed to save index HTML");
      }
      onSavedLayoutChange(html);
    },
    [indexSlotId, onSavedLayoutChange]
  );

  const handleDraftChange = useCallback((slotId: number, value: string) => {
    setDraftNamesBySlotId((prev) => ({ ...prev, [slotId]: value }));
  }, []);

  const handleSaveAdvertName = useCallback(
    async (slotId: number) => {
      const row = advertRows.find((r) => r.publication_slot_id === slotId);
      const name = String(
        draftNamesBySlotId[slotId] ?? (row ? defaultAdvertIndexEntryName(row) : "")
      ).trim();

      setSaveError(null);
      setSavingSlotId(slotId);
      try {
        const nextCommitted = { ...committedNamesBySlotId, [slotId]: name };
        setCommittedNamesBySlotId(nextCommitted);
        const html = buildAdvertiserIndexHtml(
          mergeAdvertRowsWithDisplayNames(advertRows, nextCommitted),
          magazineOptions
        );
        await persistHtml(html);
        setDraftNamesBySlotId((prev) => ({ ...prev, [slotId]: name }));
      } catch (e: unknown) {
        setSaveError((e as Error)?.message ?? "Failed to save");
      } finally {
        setSavingSlotId(null);
      }
    },
    [advertRows, committedNamesBySlotId, draftNamesBySlotId, magazineOptions, persistHtml]
  );

  const handleUpdateWithCurrentData = useCallback(async () => {
    setRebuildError(null);
    setRebuildBusy(true);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots/${indexSlotId}/rebuild-advertiser-index`,
        { method: "POST", credentials: "include" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        magazine_page_layout?: string;
      };
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      const html = String(data.magazine_page_layout ?? "");
      const map = buildNamesMapFromSavedOrDefaults(advertRows, html);
      setDraftNamesBySlotId(map);
      setCommittedNamesBySlotId(map);
      onSavedLayoutChange(html);
      await loadSlots();
    } catch (e: unknown) {
      setRebuildError((e as Error)?.message ?? "Failed to rebuild index");
    } finally {
      setRebuildBusy(false);
    }
  }, [publicationId, indexSlotId, onSavedLayoutChange, loadSlots, advertRows]);

  const resetDraftAndPreviewToListing = useCallback(() => {
    const map = buildDefaultNamesMap(advertRows);
    setDraftNamesBySlotId(map);
    setCommittedNamesBySlotId(map);
  }, [advertRows]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-800">Advertisers index</p>
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
          Advert slots in this issue ({advertRows.length})
        </p>
        {slotsLoading ? (
          <p className="text-sm text-gray-500">Loading advert slots…</p>
        ) : advertRows.length === 0 ? (
          <p className="text-sm text-gray-600 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center">
            No advert slots found. Assign adverts in the flatplan, then use{" "}
            <strong>Update with current data</strong>.
          </p>
        ) : (
          <ul className="flex flex-col gap-3 max-w-2xl">
            {advertRows.map((row) => {
              const slotId = row.publication_slot_id;
              const draftValue =
                draftNamesBySlotId[slotId] ?? defaultAdvertIndexEntryName(row);
              const committedValue =
                committedNamesBySlotId[slotId] ?? defaultAdvertIndexEntryName(row);
              const isDirty = draftValue.trim() !== committedValue.trim();
              const pageLabel = formatAdvertSlotPageDisplay(
                row.publication_page,
                row.slot_key
              );
              const mediaUrl = String(row.slot_media_url ?? "").trim();
              const rowSaving = savingSlotId === slotId;
              return (
                <li
                  key={slotId}
                  className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-blue-200 transition"
                >
                  <div className="flex flex-row items-stretch gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                        <label className="min-w-0 flex-1">
                          <span className="text-[10px] uppercase tracking-wide text-gray-500">
                            Advert name
                          </span>
                          <div className="mt-0.5 flex gap-2">
                            <input
                              type="text"
                              value={draftValue}
                              onChange={(e) => handleDraftChange(slotId, e.target.value)}
                              placeholder="—"
                              className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => void handleSaveAdvertName(slotId)}
                              disabled={rowSaving || slotsLoading || !isDirty}
                              className={`shrink-0 ${PRIMARY_BUTTON_CLASS}`}
                            >
                              {rowSaving ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </label>
                        <p className="shrink-0 pb-1.5 text-xs text-gray-600 sm:text-right">
                          <span className="text-gray-500">Advert page: </span>
                          <span className="font-semibold text-gray-900">{pageLabel}</span>
                        </p>
                      </div>
                      <Link
                        href={`${ISSUES_BASE}/${encodeURIComponent(publicationId)}/slots/${slotId}`}
                        className={`w-fit ${PRIMARY_BUTTON_CLASS}`}
                      >
                        Go to slot
                      </Link>
                    </div>
                    <div
                      className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                      aria-hidden={!mediaUrl}
                    >
                      {mediaUrl ? (
                        <FlatplanAdvertMediaThumbnail
                          url={mediaUrl}
                          className="absolute inset-0 h-full w-full object-contain opacity-100"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center px-1 text-center text-[9px] leading-tight text-gray-400">
                          No media
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
            disabled={slotsLoading || savingSlotId != null}
            className={PRIMARY_BUTTON_CLASS}
          >
            Reset preview to customer names
          </button>
        </div>
      </section>

      <section className="space-y-3 border-t border-gray-200 pt-6">
        <p className="text-xs uppercase tracking-wide text-gray-500">Page preview</p>
        <p className="text-xs text-gray-500">
          Edit a name and click <span className="font-medium">Save</span> on that row to update
          the preview below and persist to <span className="font-mono">magazine_page_layout</span>.
        </p>
        <div
          className="mx-auto w-full max-w-md overflow-hidden rounded-sm shadow-xl ring-1 ring-black/10"
          style={{ aspectRatio: "228 / 297" }}
        >
          <div
            ref={previewRef}
            className="h-full w-full overflow-hidden text-left pointer-events-none"
            aria-label="Advertiser index page preview"
          />
        </div>
      </section>
    </div>
  );
};
