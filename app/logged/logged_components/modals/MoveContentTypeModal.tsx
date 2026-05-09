"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";

/**
 * Minimal description of a preferential placement row (subset of the
 * `/api/v1/publications/[id]/preferential-slots` response) needed to build the
 * "Change <Summary|Index> Location" modal.
 */
export interface MoveContentTypePreferentialRow {
  position_in_magazine: string;
  section_title: string;
  slot_content_type: string | null;
}

export type MovableContentType = "summary" | "index";

interface MoveContentTypeModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Which reserved content type we are moving. Drives copy and the "current
   * page" detection.
   */
  contentType: MovableContentType;
  /** The current preferential placements snapshot for this publication. */
  preferentialSlots: MoveContentTypePreferentialRow[];
  /**
   * Optional initial value for the "Change for page" select. Used when the
   * modal is triggered by an inline edit (e.g. the Slots table Type select)
   * so the user immediately sees the implied target position.
   */
  initialTarget?: string | null;
  /**
   * Called when the user confirms the move. The modal does NOT perform the
   * API call itself; the parent owns the request and refresh logic. The
   * promise's resolution closes the modal automatically.
   */
  onConfirm: (targetPosition: string) => Promise<void>;
}

const ALLOWED_TARGET_POSITIONS: { value: string; label: string }[] = [
  { value: "Preferential page 2", label: "Preferential page 2" },
  { value: "Preferential page 4", label: "Preferential page 4" },
  { value: "Preferential page 6", label: "Preferential page 6" },
];

function readableLabel(ct: MovableContentType): string {
  return ct === "summary" ? "Summary" : "Index";
}

const MoveContentTypeModal: FC<MoveContentTypeModalProps> = ({
  open,
  onClose,
  contentType,
  preferentialSlots,
  initialTarget = null,
  onConfirm,
}) => {
  const [target, setTarget] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPosition = useMemo(() => {
    const match = preferentialSlots.find(
      (s) =>
        String(s.slot_content_type ?? "")
          .trim()
          .toLowerCase() === contentType
    );
    return match ? match.position_in_magazine : "";
  }, [preferentialSlots, contentType]);

  const slotsByPosition = useMemo(() => {
    const m = new Map<string, MoveContentTypePreferentialRow>();
    preferentialSlots.forEach((s) =>
      m.set(String(s.position_in_magazine ?? "").trim(), s)
    );
    return m;
  }, [preferentialSlots]);

  useEffect(() => {
    if (open) {
      const allowed = ALLOWED_TARGET_POSITIONS.some(
        (p) => p.value === initialTarget
      );
      setTarget(allowed && initialTarget ? initialTarget : "");
      setError(null);
      setSubmitting(false);
    }
  }, [open, contentType, initialTarget]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const conflictMessage = useMemo<{
    tone: "info" | "warning" | "error" | "success";
    text: string;
  } | null>(() => {
    if (!target) return null;
    if (target === currentPosition) {
      return {
        tone: "info",
        text: `${readableLabel(contentType)} is already at ${target}. Nothing to change.`,
      };
    }
    const targetSlot = slotsByPosition.get(target);
    const targetType = String(targetSlot?.slot_content_type ?? "")
      .trim()
      .toLowerCase();
    if (targetType === "summary" || targetType === "index") {
      const otherLabel =
        targetType === "summary" ? "Summary" : "Index";
      if (currentPosition) {
        return {
          tone: "warning",
          text: `Conflict: ${target} is currently reserved for the ${otherLabel}. Confirming will swap positions — ${readableLabel(
            contentType
          )} moves to ${target} and the ${otherLabel} moves to ${currentPosition}.`,
        };
      }
      return {
        tone: "warning",
        text: `Conflict: ${target} is currently reserved for the ${otherLabel}. Confirming will replace it with ${readableLabel(
          contentType
        )} (the ${otherLabel} will be cleared and become an advert).`,
      };
    }
    if (currentPosition) {
      return {
        tone: "success",
        text: `No conflict. ${readableLabel(
          contentType
        )} will move from ${currentPosition} to ${target}; ${currentPosition} will become an advert.`,
      };
    }
    return {
      tone: "success",
      text: `No conflict. ${target} will be reserved for the ${readableLabel(
        contentType
      )}.`,
    };
  }, [target, currentPosition, contentType, slotsByPosition]);

  const canConfirm =
    !submitting && !!target && target !== currentPosition;

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(target);
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to move location.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [canConfirm, onConfirm, target, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={() => {
        if (!submitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-content-type-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2
            id="move-content-type-modal-title"
            className="text-lg font-semibold text-gray-800"
          >
            Change {readableLabel(contentType)} Location
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!submitting) onClose();
            }}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none disabled:opacity-50"
            aria-label="Close"
            disabled={submitting}
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Current page
            </label>
            <input
              type="text"
              value={currentPosition || "— (not set)"}
              readOnly
              className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-800 cursor-not-allowed"
            />
          </div>

          <div>
            <label
              htmlFor="move-content-type-target"
              className="block text-xs uppercase tracking-wide text-gray-500 mb-1"
            >
              Change for page
            </label>
            <select
              id="move-content-type-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value="">Select target page…</option>
              {ALLOWED_TARGET_POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {conflictMessage ? (
            <div
              className={
                conflictMessage.tone === "warning"
                  ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  : conflictMessage.tone === "error"
                    ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                    : conflictMessage.tone === "success"
                      ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                      : "rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800"
              }
            >
              {conflictMessage.text}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              if (!submitting) onClose();
            }}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!canConfirm}
          >
            {submitting ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveContentTypeModal;
