"use client";

import React, { useMemo } from "react";

import {
  flatplanEntryKeyFromSlot,
  normalizeSlotContentType,
  type SlotRow,
} from "@/app/logged/pages/production/publications/publication_components/_shared";

export type FlatplanBulkDeleteModalPhase = "review" | "confirm";

export type FlatplanBulkDeleteModalProps = {
  open: boolean;
  phase: FlatplanBulkDeleteModalPhase;
  slots: SlotRow[];
  /** Slot ids shown as cards (fixed when the modal opens). */
  modalVisibleSlotIds: number[];
  /** Subset still checked for deletion in the review step. */
  modalCheckedSlotIds: number[];
  onToggleModalId: (publicationSlotId: number) => void;
  confirmInput: string;
  onConfirmInputChange: (value: string) => void;
  onClose: () => void;
  onYes: () => void;
  onFinalDelete: () => void;
  busy: boolean;
  error: string | null;
};

export function FlatplanBulkDeleteModal({
  open,
  phase,
  slots,
  modalVisibleSlotIds,
  modalCheckedSlotIds,
  onToggleModalId,
  confirmInput,
  onConfirmInputChange,
  onClose,
  onYes,
  onFinalDelete,
  busy,
  error,
}: FlatplanBulkDeleteModalProps) {
  const slotsSafe = Array.isArray(slots) ? slots : [];
  const modalVisibleSlotIdsSafe = Array.isArray(modalVisibleSlotIds) ? modalVisibleSlotIds : [];
  const modalCheckedSlotIdsSafe = Array.isArray(modalCheckedSlotIds) ? modalCheckedSlotIds : [];

  const slotById = useMemo(() => {
    const m = new Map<number, SlotRow>();
    for (const s of slotsSafe) {
      if (s.publication_slot_id != null) m.set(s.publication_slot_id, s);
    }
    return m;
  }, [slotsSafe]);

  if (!open) return null;

  const checkedSet = new Set(modalCheckedSlotIdsSafe);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {phase === "review"
                ? "Are you sure you want to delete slots?"
                : "Confirm deletion"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {phase === "review"
                ? "Magazine article pages are selected and removed together (all pages of the same publication article, plus its chunks). Uncheck any slot you want to keep. Preferential links and other slot contents are updated as needed."
                : "Type confirm below to permanently delete the selected slots and any linked publication articles."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1 disabled:opacity-40"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {phase === "review" ? (
          <>
            <div className="px-5 py-3 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
              {modalVisibleSlotIdsSafe.length === 0 ? (
                <p className="text-sm text-gray-500">No slots selected.</p>
              ) : (
                modalVisibleSlotIdsSafe.map((id) => {
                  const s = slotById.get(id);
                  if (!s) {
                    return (
                      <div
                        key={id}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                      >
                        Missing slot #{id} (reload the issue).
                      </div>
                    );
                  }
                  const t = normalizeSlotContentType(s.slot_content_type);
                  const checked = checkedSet.has(id);
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-red-700 shrink-0"
                        checked={checked}
                        onChange={() => onToggleModalId(id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {flatplanEntryKeyFromSlot(s)} · #{id}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t} · {String(s.slot_state ?? "—")}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              {error ? (
                <p className="mr-auto self-center text-sm text-red-600 max-w-[55%]">{error}</p>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onYes}
                disabled={busy || modalCheckedSlotIdsSafe.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-red-700 rounded-lg hover:bg-red-800 disabled:opacity-50"
              >
                Yes
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-5 py-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Type <span className="font-mono text-red-800">confirm</span> to proceed
                <input
                  type="text"
                  value={confirmInput}
                  onChange={(e) => onConfirmInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    if (busy || confirmInput.trim().toLowerCase() !== "confirm") return;
                    e.preventDefault();
                    onFinalDelete();
                  }}
                  disabled={busy}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoComplete="off"
                />
              </label>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              {error ? (
                <p className="mr-auto self-center text-sm text-red-600 max-w-[55%]">{error}</p>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onFinalDelete}
                disabled={busy || confirmInput.trim().toLowerCase() !== "confirm"}
                className="px-4 py-2 text-sm font-medium text-white bg-red-800 rounded-lg hover:bg-red-900 disabled:opacity-50"
              >
                {busy ? "Deleting…" : "OK"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
