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

  useEffect(() => {
    if (!open) return;
    const next = new Set<number>();
    (initialSelectedSlotIds ?? []).forEach((id) => {
      if (Number.isFinite(Number(id))) next.add(Number(id));
    });
    setSelectedIds(next);
    setFilterText("");
    setSubmitError(null);
  }, [open, initialSelectedSlotIds]);

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
        flatplanOrder: flatplanSortKey(String(s.slot_key ?? "")),
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
        slotDisplayName(s.slot_key),
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
          ) : (
            <PublicationSlotPickerTable
              mode={mode}
              filteredSlots={filteredSlots}
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
