"use client";

import { useEffect } from "react";
import { ConfirmActionModalContent } from "./modal_confirm_action_components/ConfirmActionModalContent";
import type { ConfirmActionModalProps } from "./modal_confirm_action_components/types";

export type { ConfirmActionModalProps } from "./modal_confirm_action_components/types";

export default function ConfirmActionModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirming,
  onClose,
  onConfirm,
}: ConfirmActionModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <ConfirmActionModalContent
      title={title}
      message={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      confirming={confirming}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
