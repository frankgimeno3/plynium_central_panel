"use client";

import { FC, useEffect, useState } from "react";
import apiClient from "@/app/apiClient";
import { DeleteNewsletterUserListConfirmDialog } from "./nl_list_confirm_components/Dialog";
import { CONFIRM_WORD } from "./nl_list_confirm_components/constants";
import type { DeleteNewsletterUserListConfirmModalProps } from "./nl_list_confirm_components/types";

export type { DeleteNewsletterUserListConfirmModalProps } from "./nl_list_confirm_components/types";

const DeleteNewsletterUserListConfirmModal: FC<DeleteNewsletterUserListConfirmModalProps> = ({
  open,
  onClose,
  listId,
  listName,
  onDeleted,
}) => {
  const [confirmInput, setConfirmInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmInput("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleDelete = async () => {
    const canDelete = confirmInput === CONFIRM_WORD;
    if (!canDelete || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient.delete(`/api/v1/user-lists/${encodeURIComponent(listId)}`);
      onClose();
      onDeleted();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: unknown }).message)
          : "Could not delete this list.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <DeleteNewsletterUserListConfirmDialog
      listId={listId}
      listName={listName}
      confirmInput={confirmInput}
      busy={busy}
      error={error}
      onClose={onClose}
      onConfirmInputChange={setConfirmInput}
      onDelete={handleDelete}
    />
  );
};

export default DeleteNewsletterUserListConfirmModal;
