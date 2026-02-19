"use client";

import React, { FC, useEffect, useState } from "react";

interface ChangeImageModalProps {
  isOpen: boolean;
  currentSrc: string;
  onConfirm: (newSrc: string) => void;
  onCancel: () => void;
}

const ChangeImageModal: FC<ChangeImageModalProps> = ({
  isOpen,
  currentSrc,
  onConfirm,
  onCancel,
}) => {
  const [newSrc, setNewSrc] = useState<string>("");
  const [srcError, setSrcError] = useState<string>("");

  const validateSrc = (src: string): string => {
    const trimmedSrc = src.trim();
    
    if (!trimmedSrc) {
      return "Source URL is required";
    }
    
    // Check if it's a valid URL (http/https) or a valid data URI
    const urlPattern = /^(https?:\/\/|data:)/i;
    if (!urlPattern.test(trimmedSrc)) {
      return "Source must be a valid URL (http:// or https://) or data URI";
    }
    
    // Additional validation for http/https URLs
    if (trimmedSrc.startsWith("http://") || trimmedSrc.startsWith("https://")) {
      try {
        new URL(trimmedSrc);
      } catch {
        return "Invalid URL format";
      }
    }
    
    return "";
  };

  const handleUpdate = () => {
    const trimmedSrc = newSrc.trim();
    const error = validateSrc(trimmedSrc);
    
    if (trimmedSrc && !error && trimmedSrc !== currentSrc) {
      onConfirm(trimmedSrc);
      setNewSrc("");
      setSrcError("");
    }
  };

  const canUpdate = newSrc.trim() !== "" && newSrc.trim() !== currentSrc && srcError === "";

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewSrc("");
      setSrcError("");
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
        const src = newSrc.trim();
        const error = validateSrc(src);
        const isValid = src !== "" && src !== currentSrc && error === "";
        
        if (isValid) {
          event.preventDefault();
          if (src && !error && src !== currentSrc) {
            onConfirm(src);
            setNewSrc("");
            setSrcError("");
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
  }, [isOpen, onCancel, onConfirm, currentSrc, newSrc]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleSrcChange = (value: string) => {
    setNewSrc(value);
    const error = validateSrc(value);
    setSrcError(error);
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
          Change Image
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current Image src:
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-sm text-gray-600 cursor-not-allowed"
            value={currentSrc}
            readOnly
            disabled
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            New Src:
          </label>
          <input
            type="text"
            className={`w-full rounded-md border p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
              srcError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            value={newSrc}
            onChange={(event) => handleSrcChange(event.target.value)}
            placeholder="Enter new image URL"
          />
          {srcError && (
            <p className="mt-1 text-xs text-red-500">{srcError}</p>
          )}
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
            onClick={handleUpdate}
            disabled={!canUpdate}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              canUpdate
                ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeImageModal;
