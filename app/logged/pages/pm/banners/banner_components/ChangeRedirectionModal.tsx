"use client";

import React, { FC, useEffect, useState } from "react";

interface ChangeRedirectionModalProps {
  isOpen: boolean;
  currentRedirection: string;
  onConfirm: (newUrl: string) => void;
  onCancel: () => void;
}

const isValidUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const ChangeRedirectionModal: FC<ChangeRedirectionModalProps> = ({
  isOpen,
  currentRedirection,
  onConfirm,
  onCancel,
}) => {
  const [newUrl, setNewUrl] = useState<string>("");
  const [urlError, setUrlError] = useState<string>("");

  const validateUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "URL is required";
    if (!isValidUrl(trimmed)) return "Must be a valid URL (http:// or https://)";
    return "";
  };

  const handleUrlChange = (value: string) => {
    setNewUrl(value);
    setUrlError(validateUrl(value));
  };

  const handleConfirm = () => {
    const trimmed = newUrl.trim();
    if (isValidUrl(trimmed) && trimmed !== currentRedirection) {
      onConfirm(trimmed);
      setNewUrl("");
      setUrlError("");
    }
  };

  const canConfirm =
    newUrl.trim() !== "" &&
    isValidUrl(newUrl.trim()) &&
    newUrl.trim() !== currentRedirection;

  useEffect(() => {
    if (isOpen) {
      setNewUrl("");
      setUrlError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      else if (event.key === "Enter" && canConfirm) {
        event.preventDefault();
        handleConfirm();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel, canConfirm, newUrl, currentRedirection]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onCancel}
          aria-label="Cerrar modal"
        >
          ×
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-800">
          Change Redirection
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Current BannerRedirection:
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-gray-100 p-2 text-sm text-gray-600 cursor-not-allowed"
            value={currentRedirection}
            readOnly
            disabled
          />
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            New URL:
          </label>
          <input
            type="text"
            className={`w-full rounded-md border p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
              urlError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            value={newUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Enter new redirection URL"
          />
          {urlError && (
            <p className="mt-1 text-xs text-red-500">{urlError}</p>
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

export default ChangeRedirectionModal;
