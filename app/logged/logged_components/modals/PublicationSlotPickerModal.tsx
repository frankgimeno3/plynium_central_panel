"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

export interface PublicationSlotPickerRow {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
  slot_content_type: string;
  slot_state: string;
  customer_id: string | null;
  project_id: string | null;
  customer_name?: string | null;
}

type SelectionMode = "single" | "multi";

export interface PublicationSlotPickerModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Publication whose slots are listed. The modal hits
   * `GET /api/v1/publications-db/[publicationId]/slots`.
   */
  publicationId: string;
  /**
   * `single` returns a single slot id on confirm; `multi` lets the user pick
   * one or more slots (used by the Article Builder when an article spans
   * several pages).
   */
  mode?: SelectionMode;
  /** Override the modal title (default "Select publication slot"). */
  title?: string;
  /** Override the confirm button label. */
  confirmLabel?: string;
  /**
   * Optional predicate to restrict which slots can be picked. Slots failing
   * the predicate are still listed but rendered disabled.
   */
  isSlotSelectable?: (slot: PublicationSlotPickerRow) => boolean;
  /**
   * Optional pre-selected ids on open (useful when re-editing an assignment).
   */
  initialSelectedSlotIds?: number[];
  /**
   * Resolves with the user's choice. Single mode returns an array of length 1.
   */
  onConfirm: (slotIds: number[]) => void | Promise<void>;
}

interface SortedSlot extends PublicationSlotPickerRow {
  /** Numeric sort key derived from slot_key (cover/inside_cover/end included). */
  flatplanOrder: number;
}

function flatplanSortKey(slotKey: string): number {
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return -1;
  if (k === "inside_cover" || k === "inside cover") return 0;
  if (k === "end" || k === "end_page" || k === "end page") return 1_000_000;
  const n = Number(k);
  return Number.isFinite(n) ? n : 999_999;
}

function slotDisplayName(slotKey: string): string {
  const k = String(slotKey ?? "").trim().toLowerCase();
  if (k === "cover") return "Cover";
  if (k === "inside_cover" || k === "inside cover") return "Inside cover";
  if (k === "end" || k === "end_page" || k === "end page") return "End page";
  if (k === "regular_page") return "Regular page";
  const n = Number(k);
  if (Number.isFinite(n)) return `Page ${n}`;
  return slotKey;
}

function tonesForState(state: string): string {
  const s = String(state ?? "").trim().toLowerCase();
  if (s === "bought") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (s === "offered") return "border-amber-200 bg-amber-50 text-amber-800";
  if (s === "assigned") return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-gray-200 bg-gray-50 text-gray-700";
}

/**
 * Reusable modal for picking one or several publication slots out of the
 * `publication_slots_db` rows belonging to a given publication. Closes on the
 * backdrop / ESC / X / Cancel buttons.
 */
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
    } catch (e: any) {
      setLoadError(e?.message ?? "Failed to load publication slots");
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
    } catch (e: any) {
      setSubmitError(e?.message ?? "Failed to confirm slot selection");
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
            <h2
              id="publication-slot-picker-title"
              className="text-lg font-semibold text-gray-900"
            >
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
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by id, slot key, content type, customer, project…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {loadError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {loadError}
            </div>
          ) : null}
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">Loading slots…</div>
          ) : (
            <div className="max-h-[420px] overflow-auto rounded-lg border border-gray-200">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium w-10"> </th>
                    <th className="px-3 py-2 text-left font-medium">Slot</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-left font-medium">State</th>
                    <th className="px-3 py-2 text-left font-medium">Customer</th>
                    <th className="px-3 py-2 text-left font-medium">Project</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSlots.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-gray-500" colSpan={6}>
                        No slots match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSlots.map((slot) => {
                      const selectable = isSlotSelectable
                        ? isSlotSelectable(slot)
                        : true;
                      const isSelected = selectedIds.has(slot.publication_slot_id);
                      return (
                        <tr
                          key={slot.publication_slot_id}
                          className={`border-t border-gray-200 ${
                            selectable ? "hover:bg-blue-50/40 cursor-pointer" : "opacity-60"
                          } ${isSelected ? "bg-blue-50/70" : ""}`}
                          onClick={() => selectable && toggleSlot(slot)}
                        >
                          <td className="px-3 py-2">
                            <input
                              type={mode === "single" ? "radio" : "checkbox"}
                              checked={isSelected}
                              onChange={() => selectable && toggleSlot(slot)}
                              disabled={!selectable}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-medium text-gray-900">
                              {slotDisplayName(slot.slot_key)}
                            </p>
                            <p className="text-[11px] font-mono text-gray-500">
                              #{slot.publication_slot_id} · {slot.slot_key || "—"}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {slot.slot_content_type || "—"}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tonesForState(
                                slot.slot_state
                              )}`}
                            >
                              {slot.slot_state || "—"}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-700">
                            {slot.customer_name?.trim() || slot.customer_id || "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-700 font-mono text-[11px]">
                            {slot.project_id || "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {submitError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {submitError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <span className="mr-auto text-xs text-gray-500">
            {selectedIds.size === 0
              ? "No slots selected."
              : `${selectedIds.size} slot${selectedIds.size === 1 ? "" : "s"} selected.`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirmClick}
            disabled={selectedIds.size === 0 || submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving…" : computedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicationSlotPickerModal;
