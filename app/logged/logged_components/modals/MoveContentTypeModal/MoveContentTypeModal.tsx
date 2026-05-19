"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ALLOWED_TARGET_POSITIONS } from "./modal_move_content_type_components/constants";
import { readableLabel } from "./modal_move_content_type_components/helpers";
import MoveContentTypeFooter from "./modal_move_content_type_components/MoveContentTypeFooter";
import MoveContentTypeForm from "./modal_move_content_type_components/MoveContentTypeForm";
import {
  preferentialSlotHasOccupyingContent,
  preferentialSlotHasUploadedMedia,
} from "./modal_move_content_type_components/slotContentConflict";
import type {
  ConflictMessage,
  MoveContentTypeModalProps,
  MoveContentTypePreferentialRow,
  MovableContentType,
  ReservedConflict,
} from "./modal_move_content_type_components/types";

export type {
  MoveContentTypePreferentialRow,
  MovableContentType,
} from "./modal_move_content_type_components/types";

const MoveContentTypeModal: FC<MoveContentTypeModalProps> = ({
  open,
  onClose,
  contentType,
  preferentialSlots,
  initialTarget = null,
  onConfirm,
}) => {
  const [target, setTarget] = useState("");
  const [manualRepositionEnabled, setManualRepositionEnabled] = useState(false);
  const [displacedTarget, setDisplacedTarget] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPosition = useMemo(() => {
    const match = preferentialSlots.find(
      (slot) =>
        String(slot.slot_content_type ?? "")
          .trim()
          .toLowerCase() === contentType
    );
    return match ? match.position_in_magazine : "";
  }, [preferentialSlots, contentType]);

  const slotsByPosition = useMemo(() => {
    const map = new Map<string, MoveContentTypePreferentialRow>();
    preferentialSlots.forEach((slot) =>
      map.set(String(slot.position_in_magazine ?? "").trim(), slot)
    );
    return map;
  }, [preferentialSlots]);

  useEffect(() => {
    if (open) {
      const allowed = ALLOWED_TARGET_POSITIONS.some((position) => position.value === initialTarget);
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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  const reservedConflict = useMemo<ReservedConflict | null>(() => {
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

  const conflictMessage = useMemo<ConflictMessage | null>(() => {
    if (!target) return null;
    if (target === currentPosition) {
      return {
        tone: "info",
        text: `${readableLabel(contentType)} is already at ${target}. Nothing to change.`,
      };
    }
    const targetSlot = slotsByPosition.get(target);
    const targetHasOccupyingContent =
      !reservedConflict && preferentialSlotHasOccupyingContent(targetSlot);
    const targetHasPdf = preferentialSlotHasUploadedMedia(targetSlot);

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
            currentPosition ? ` ${currentPosition} will become an advert.` : ""
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
    if (targetHasOccupyingContent && currentPosition) {
      const mediaNote = targetHasPdf
        ? " An advert PDF (or other media) is already uploaded on that page."
        : " That page already has slot content assigned.";
      return {
        tone: "warning",
        text: `Conflict:${mediaNote} Confirming will swap slots: ${readableLabel(
          contentType
        )} moves to ${target} and the existing content moves to ${currentPosition}.`,
      };
    }
    if (targetHasOccupyingContent) {
      const mediaNote = targetHasPdf
        ? " An advert PDF is already uploaded on that page."
        : " That page already has content.";
      return {
        tone: "warning",
        text: `Conflict:${mediaNote} Confirming will place ${readableLabel(
          contentType
        )} on ${target}; review whether the existing advert should be cleared first.`,
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
      text: `No conflict. ${target} will be reserved for the ${readableLabel(contentType)}.`,
    };
  }, [
    target,
    currentPosition,
    contentType,
    reservedConflict,
    manualRepositionEnabled,
    displacedTarget,
    slotsByPosition,
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
      const message = e instanceof Error ? e.message : "Failed to move location.";
      setError(message);
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
        onClick={(event) => event.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="move-content-type-modal-title" className="text-lg font-semibold text-gray-800">
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

        <MoveContentTypeForm
          currentPosition={currentPosition}
          target={target}
          submitting={submitting}
          conflictMessage={conflictMessage}
          reservedConflict={reservedConflict}
          manualRepositionEnabled={manualRepositionEnabled}
          displacedTarget={displacedTarget}
          displacedTargetOptions={displacedTargetOptions}
          error={error}
          onTargetChange={setTarget}
          onManualRepositionToggle={() => setManualRepositionEnabled((prev) => !prev)}
          onDisplacedTargetChange={setDisplacedTarget}
        />

        <MoveContentTypeFooter
          submitting={submitting}
          canConfirm={canConfirm}
          onClose={() => {
            if (!submitting) onClose();
          }}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default MoveContentTypeModal;
