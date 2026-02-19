// AddTagModal.tsx
"use client";

import React, { FC, useEffect, useState } from "react";

interface AddTagModalProps {
  isOpen: boolean;
  initialValue?: string;
  onSave: (newTag: string) => void;
  onCancel: () => void;
}

const AddTagModal: FC<AddTagModalProps> = ({
  isOpen,
  initialValue = "",
  onSave,
  onCancel,
}) => {
  const [currentValue, setCurrentValue] = useState<string>(initialValue);

  useEffect(() => {
    if (isOpen) {
      setCurrentValue(initialValue);
    }
  }, [initialValue, isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter") {
        // Enter guarda si hay cambios
        const trimmedValue = currentValue.trim();
        const hasChanged = trimmedValue !== initialValue.trim() && trimmedValue !== "";
        if (hasChanged) {
          event.preventDefault();
          onSave(trimmedValue);
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onCancel, currentValue, initialValue, onSave]);

  if (!isOpen) {
    return null;
  }

  const trimmedValue = currentValue.trim();
  const hasChanged = trimmedValue !== initialValue.trim() && trimmedValue !== "";

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleSaveClick = () => {
    if (!hasChanged) {
      return;
    }
    onSave(trimmedValue);
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
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
          onClick={onCancel}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Add tag
        </h2>

        <label className="mb-2 block text-sm font-medium text-gray-700">
          Tag name
        </label>
        <input
          type="text"
          className="mb-4 w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          value={currentValue}
          onChange={(event) => setCurrentValue(event.target.value)}
        />

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
            onClick={handleSaveClick}
            disabled={!hasChanged}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white
              ${
                hasChanged
                  ? "cursor-pointer bg-blue-600 hover:bg-blue-700"
                  : "cursor-not-allowed bg-blue-300"
              }`}
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTagModal;
