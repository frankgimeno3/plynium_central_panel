"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import PublicationSlotPickerFilter from "./modal_publication_slot_picker_components/PublicationSlotPickerFilter";
import { PublicationSlotPickerFooterBar } from "./modal_publication_slot_picker_components/PublicationSlotPickerFooterBar";
import { PublicationSlotPickerTable } from "./modal_publication_slot_picker_components/PublicationSlotPickerTable";
import { flatplanSortKey, slotDisplayName, type SortedSlot } from "./modal_publication_slot_picker_components/slot_helpers";
import type {
  PublicationSlotPickerModalProps,
  PublicationSlotPickerRow,
} from "./modal_publication_slot_picker_components/types";

export type {
  PublicationSlotPickerModalProps,
  PublicationSlotPickerRow,
} from "./modal_publication_slot_picker_components/types";

const PublicationSlotPickerModal: FC<PublicationSlotPickerModalProps> = ({
  open,
  onClose,
  publicationId,
  mode = "single",
  title = "Select publication slot",
  confirmLabel,
  isSlotSelectable,
  initialSelectedSlotIds,
  onConfirm,
}) => {
  const [slots, setSlots] = useState<SortedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const initialSelectedKey = useMemo(
    () =>
      JSON.stringify(
        (initialSelectedSlotIds ?? [])
          .map((id) => Number(id))
          .filter((n) => Number.isFinite(n))
          .sort((a, b) => a - b)
      ),
    [initialSelectedSlotIds]
  );

  useEffect(() => {
    if (!open) return;
    const next = new Set<number>();
    let parsed: unknown[] = [];
    try {
      parsed = JSON.parse(initialSelectedKey) as unknown[];
    } catch {
      parsed = [];
    }
    parsed.forEach((id) => {
      const n = Number(id);
      if (Number.isFinite(n)) next.add(n);
    });
    setSelectedIds(next);
    setFilterText("");
    setSubmitError(null);
  }, [open, initialSelectedKey]);

  const loadSlots = useCallback(async () => {
    if (!publicationId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/v1/publications-db/${encodeURIComponent(publicationId)}/slots`,
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Failed to load publication slots");
      }
      const json = (await res.json()) as PublicationSlotPickerRow[];
      const list: SortedSlot[] = (Array.isArray(json) ? json : []).map((s) => ({
        ...s,
        flatplanOrder: flatplanSortKey(String(s.slot_key ?? ""), s.slot_ordinal),
      }));
      list.sort((a, b) => a.flatplanOrder - b.flatplanOrder);
      setSlots(list);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load publication slots";
      setLoadError(msg);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [publicationId]);

  useEffect(() => {
    if (open) loadSlots();
  }, [open, loadSlots]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filteredSlots = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return slots;
    return slots.filter((s) => {
      const haystack = [
        String(s.publication_slot_id),
        s.slot_key,
        slotDisplayName(s.slot_key, s.publication_page),
        s.slot_content_type,
        s.slot_state,
        s.customer_id ?? "",
        s.customer_name ?? "",
        s.project_id ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [slots, filterText]);

  /** Slots the user may pick: text filter + optional `isSlotSelectable` (non-matching rows are omitted, not greyed out). */
  const visibleSlots = useMemo(() => {
    if (!isSlotSelectable) return filteredSlots;
    return filteredSlots.filter((s) => isSlotSelectable(s));
  }, [filteredSlots, isSlotSelectable]);

  useEffect(() => {
    if (!open || loading || !isSlotSelectable) return;
    setSelectedIds((prev) => {
      const allowed = new Set(visibleSlots.map((s) => s.publication_slot_id));
      const next = new Set<number>();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
      });
      if (prev.size === next.size) {
        let same = true;
        for (const id of prev) {
          if (!next.has(id)) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return next;
    });
  }, [open, loading, isSlotSelectable, visibleSlots]);

  const toggleSlot = useCallback(
    (slot: SortedSlot) => {
      if (isSlotSelectable && !isSlotSelectable(slot)) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (mode === "single") {
          next.clear();
          next.add(slot.publication_slot_id);
        } else if (next.has(slot.publication_slot_id)) {
          next.delete(slot.publication_slot_id);
        } else {
          next.add(slot.publication_slot_id);
        }
        return next;
      });
    },
    [mode, isSlotSelectable]
  );

  const onConfirmClick = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm(Array.from(selectedIds.values()));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to confirm slot selection";
      setSubmitError(msg);
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  }, [onConfirm, selectedIds]);

  if (!open) return null;

  const computedConfirmLabel =
    confirmLabel ??
    (mode === "multi"
      ? `Assign ${selectedIds.size || ""} slot${selectedIds.size === 1 ? "" : "s"}`.trim()
      : "Assign slot");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publication-slot-picker-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl mx-4 overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 id="publication-slot-picker-title" className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "multi"
                ? "Pick one or more slots from this publication."
                : "Pick a single slot from this publication."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          <PublicationSlotPickerFilter value={filterText} onChange={setFilterText} />
          {loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </div>
          ) : null}
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading slots…</div>
          ) : visibleSlots.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              {slots.length === 0
                ? "No slots loaded for this publication."
                : filterText.trim()
                  ? "No slots match the filter."
                  : isSlotSelectable
                    ? "No slots are available for this action."
                    : "No slots match the filter."}
            </div>
          ) : (
            <PublicationSlotPickerTable
              mode={mode}
              filteredSlots={visibleSlots}
              selectedIds={selectedIds}
              isSlotSelectable={isSlotSelectable}
              onToggle={toggleSlot}
            />
          )}

          {submitError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {submitError}
            </div>
          ) : null}
        </div>

        <PublicationSlotPickerFooterBar
          selectedCount={selectedIds.size}
          submitting={submitting}
          confirmLabel={computedConfirmLabel}
          onClose={onClose}
          onConfirm={onConfirmClick}
        />
      </div>
    </div>
  );
};

export default PublicationSlotPickerModal;
