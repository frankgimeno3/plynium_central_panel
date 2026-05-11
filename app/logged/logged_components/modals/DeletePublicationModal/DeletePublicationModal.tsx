"use client";

import { FC, useEffect } from "react";
import { DeletePublicationModalBody } from "./modal_delete_publication_components/DeletePublicationModalBody";
import type { DeletePublicationModalProps } from "./modal_delete_publication_components/types";

export type { DeletePublicationModalProps } from "./modal_delete_publication_components/types";

const DeletePublicationModal: FC<DeletePublicationModalProps> = ({
  isOpen,
  publicationName,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <DeletePublicationModalBody
        publicationName={publicationName}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
};

export default DeletePublicationModal;
