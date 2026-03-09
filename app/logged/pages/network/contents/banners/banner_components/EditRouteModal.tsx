"use client";

import React, { FC, useEffect, useState } from "react";

interface EditRouteModalProps {
  isOpen: boolean;
  currentRoute: string;
  onConfirm: (newRoute: string) => void;
  onCancel: () => void;
}

const EditRouteModal: FC<EditRouteModalProps> = ({
  isOpen,
  currentRoute,
  onConfirm,
  onCancel,
}) => {
  const [newRoute, setNewRoute] = useState<string>("");

  const handleConfirm = () => {
    if (newRoute.trim() && newRoute.trim() !== currentRoute) {
      onConfirm(newRoute.trim());
      setNewRoute("");
    }
  };

  const canConfirm = newRoute.trim() !== "" && newRoute.trim() !== currentRoute;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewRoute("");
    }
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      } else if (event.key === "Enter") {
        // Check if button should be enabled before allowing Enter
        const route = newRoute.trim();
        const isValid = route !== "" && route !== currentRoute;
        
        if (isValid) {
          event.preventDefault();
          if (route && route !== currentRoute) {
            onConfirm(route);
            setNewRoute("");
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel, onConfirm, newRoute, currentRoute]);

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
          Edit Route
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Route
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-500 bg-gray-100 cursor-not-allowed"
            value={currentRoute}
            readOnly
            disabled
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            New Route
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={newRoute}
            onChange={(event) => setNewRoute(event.target.value)}
            placeholder="Enter new route"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              canConfirm
                ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditRouteModal;
