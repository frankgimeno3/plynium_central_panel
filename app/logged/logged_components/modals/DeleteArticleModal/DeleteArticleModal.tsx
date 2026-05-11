"use client";

import { FC, useEffect } from "react";
import { DeleteArticleModalBody } from "./modal_delete_article_components/DeleteArticleModalBody";
import type { DeleteArticleModalProps } from "./modal_delete_article_components/types";

export type { DeleteArticleModalProps } from "./modal_delete_article_components/types";

const DeleteArticleModal: FC<DeleteArticleModalProps> = ({
  isOpen,
  articleTitle,
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
      <DeleteArticleModalBody
        articleTitle={articleTitle}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
};

export default DeleteArticleModal;
