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
  onConfirm: (targetPosition: string, displacedPosition?: string | null) => Promise<void>;
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
  const [manualRepositionEnabled, setManualRepositionEnabled] = useState(false);
  const [displacedTarget, setDisplacedTarget] = useState<string>("");
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
      setManualRepositionEnabled(false);
      setDisplacedTarget("");
      setError(null);
      setSubmitting(false);
    }
  }, [open, contentType, initialTarget]);

  useEffect(() => {
    if (!open) return;
    setManualRepositionEnabled(false);
    setDisplacedTarget("");
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const reservedConflict = useMemo(() => {
    if (!target || target === currentPosition) return null;
    const targetSlot = slotsByPosition.get(target);
    const targetType = String(targetSlot?.slot_content_type ?? "")
      .trim()
      .toLowerCase();
    if (targetType !== "summary" && targetType !== "index") return null;
    if (targetType === contentType) return null;
    return {
      otherType: targetType as MovableContentType,
      otherLabel: targetType === "summary" ? "Summary" : "Index",
    };
  }, [target, currentPosition, contentType, slotsByPosition]);

  const displacedTargetOptions = useMemo(
    () => ALLOWED_TARGET_POSITIONS.filter((position) => position.value !== target),
    [target]
  );

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
    if (reservedConflict) {
      if (manualRepositionEnabled) {
        if (!displacedTarget) {
          return {
            tone: "warning",
            text: `Conflict: ${target} is currently reserved for the ${reservedConflict.otherLabel}. Choose where to move the ${reservedConflict.otherLabel} before confirming.`,
          };
        }
        return {
          tone: "warning",
          text: `Conflict: ${readableLabel(contentType)} will move to ${target} and the ${reservedConflict.otherLabel} will move to ${displacedTarget}.${
            currentPosition
              ? ` ${currentPosition} will become an advert.`
              : ""
          }`,
        };
      }
      if (currentPosition) {
        return {
          tone: "warning",
          text: `Conflict: ${target} is currently reserved for the ${reservedConflict.otherLabel}. Confirming will swap positions — ${readableLabel(
            contentType
          )} moves to ${target} and the ${reservedConflict.otherLabel} moves to ${currentPosition}.`,
        };
      }
      return {
        tone: "warning",
        text: `Conflict: ${target} is currently reserved for the ${reservedConflict.otherLabel}. Confirming will replace it with ${readableLabel(
          contentType
        )} (the ${reservedConflict.otherLabel} will be cleared and become an advert).`,
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
  }, [
    target,
    currentPosition,
    contentType,
    reservedConflict,
    manualRepositionEnabled,
    displacedTarget,
  ]);

  const canConfirm =
    !submitting &&
    !!target &&
    target !== currentPosition &&
    (!reservedConflict ||
      !manualRepositionEnabled ||
      (!!displacedTarget && displacedTarget !== target));

  const handleConfirm = useCallback(async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm(
        target,
        reservedConflict && manualRepositionEnabled ? displacedTarget : null
      );
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to move location.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    canConfirm,
    onConfirm,
    target,
    reservedConflict,
    manualRepositionEnabled,
    displacedTarget,
    onClose,
  ]);

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

          {reservedConflict ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-700">
                  Reposition the {reservedConflict.otherLabel} manually?
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm ${
                      manualRepositionEnabled ? "text-gray-500" : "font-medium text-gray-900"
                    }`}
                  >
                    No
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={manualRepositionEnabled}
                    aria-label={`Reposition the ${reservedConflict.otherLabel} manually`}
                    onClick={() => setManualRepositionEnabled((prev) => !prev)}
                    disabled={submitting}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                      manualRepositionEnabled ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                        manualRepositionEnabled ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm ${
                      manualRepositionEnabled ? "font-medium text-gray-900" : "text-gray-500"
                    }`}
                  >
                    Yes
                  </span>
                </div>
              </div>

              {manualRepositionEnabled ? (
                <div>
                  <label
                    htmlFor="move-content-type-displaced-target"
                    className="mb-1 block text-xs uppercase tracking-wide text-gray-500"
                  >
                    Move {reservedConflict.otherLabel} to
                  </label>
                  <select
                    id="move-content-type-displaced-target"
                    value={displacedTarget}
                    onChange={(event) => setDisplacedTarget(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  >
                    <option value="">Select page for the {reservedConflict.otherLabel}…</option>
                    {displacedTargetOptions.map((position) => (
                      <option key={position.value} value={position.value}>
                        {position.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
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
