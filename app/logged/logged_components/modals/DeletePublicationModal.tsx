"use client";

import React, { FC, useEffect } from "react";

interface DeletePublicationModalProps {
  isOpen: boolean;
  publicationName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

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

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={handleModalClick}
      >
        {/* Botón de cerrar (X) */}
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onCancel}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          ¿Está seguro de eliminar la publicación?
        </h2>

        <p className="mb-6 text-sm text-gray-600">
          La publicación <strong>"{publicationName}"</strong> será eliminada permanentemente. Esta acción no se puede deshacer.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePublicationModal;


