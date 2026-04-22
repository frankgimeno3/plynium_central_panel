"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";

const BANNERS_MEDIA_LIBRARY_PATH = "Structural media/Network media/content media/banners media";

const decodeRepeatedly = (value: string): string => {
  let current = value;
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) break;
      current = decoded;
    } catch {
      break;
    }
  }
  return current;
};

const normalizeSrc = (src: string): string => {
  const trimmedSrc = src.trim();
  if (!trimmedSrc || trimmedSrc.startsWith("data:")) return trimmedSrc;
  try {
    const parsed = new URL(trimmedSrc);
    parsed.pathname = parsed.pathname
      .split("/")
      .map((segment) => encodeURIComponent(decodeRepeatedly(segment)))
      .join("/");
    return parsed.toString();
  } catch {
    return trimmedSrc;
  }
};

const isValidHttpUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const validateImageSrc = (src: string): string => {
  const trimmedSrc = normalizeSrc(src);
  if (!trimmedSrc) return "Image src is required";
  const urlPattern = /^(https?:\/\/|data:)/i;
  if (!urlPattern.test(trimmedSrc)) {
    return "Image src must be a valid URL (http:// or https://) or data URI";
  }
  if (trimmedSrc.startsWith("http://") || trimmedSrc.startsWith("https://")) {
    try {
      new URL(trimmedSrc);
    } catch {
      return "Invalid image URL format";
    }
  }
  return "";
};

const validateRedirectionUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "Redirection URL is required";
  if (!isValidHttpUrl(trimmed)) return "Must be a valid URL (http:// or https://)";
  return "";
};

export interface AddBannerModalValue {
  src: string;
  bannerRedirection: string;
}

interface AddBannerModalProps {
  isOpen: boolean;
  defaultRedirection: string;
  onConfirm: (value: AddBannerModalValue) => void;
  onCancel: () => void;
}

const AddBannerModal: FC<AddBannerModalProps> = ({
  isOpen,
  defaultRedirection,
  onConfirm,
  onCancel,
}) => {
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [src, setSrc] = useState("");
  const [bannerRedirection, setBannerRedirection] = useState("");
  const [srcError, setSrcError] = useState("");
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setMediatecaOpen(false);
      return;
    }
    setSrc("");
    setBannerRedirection(defaultRedirection || "");
    setSrcError("");
    setUrlError("");
  }, [isOpen, defaultRedirection]);

  const normalizedSrc = useMemo(() => normalizeSrc(src), [src]);

  const canConfirm =
    isOpen &&
    normalizedSrc.trim() !== "" &&
    bannerRedirection.trim() !== "" &&
    validateImageSrc(normalizedSrc) === "" &&
    validateRedirectionUrl(bannerRedirection) === "";

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
      else if (event.key === "Enter" && canConfirm) {
        event.preventDefault();
        onConfirm({
          src: normalizeSrc(src),
          bannerRedirection: bannerRedirection.trim(),
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel, onConfirm, canConfirm, src, bannerRedirection]);

  if (!isOpen) return null;

  const handleSelectImageFromMediateca = (imageUrl: string) => {
    const url = normalizeSrc(imageUrl || "");
    setSrc(url);
    setSrcError(validateImageSrc(url));
    setMediatecaOpen(false);
  };

  const handleConfirm = () => {
    const nextSrc = normalizeSrc(src);
    const nextRedir = bannerRedirection.trim();
    const se = validateImageSrc(nextSrc);
    const ue = validateRedirectionUrl(nextRedir);
    setSrcError(se);
    setUrlError(ue);
    if (se || ue) return;
    onConfirm({ src: nextSrc, bannerRedirection: nextRedir });
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={onCancel}>
        <div
          className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute right-4 top-4 text-2xl text-gray-500 hover:text-gray-700"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>

          <h2 className="mb-4 text-xl font-semibold text-gray-800">Add banner</h2>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">Image</label>
            <button
              type="button"
              onClick={() => setMediatecaOpen(true)}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Select image from Mediateca
            </button>
            {normalizedSrc ? (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={normalizedSrc}
                  alt="Selected"
                  className="h-14 w-14 rounded border border-gray-200 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 truncate" title={normalizedSrc}>
                    {normalizedSrc}
                  </p>
                </div>
              </div>
            ) : null}
            {srcError ? <p className="mt-1 text-xs text-red-500">{srcError}</p> : null}
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">Redirection URL</label>
            <input
              type="text"
              className={`w-full rounded-md border p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
                urlError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              value={bannerRedirection}
              onChange={(e) => {
                const value = e.target.value;
                setBannerRedirection(value);
                setUrlError(validateRedirectionUrl(value));
              }}
              placeholder="https://..."
            />
            {urlError ? <p className="mt-1 text-xs text-red-500">{urlError}</p> : null}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!canConfirm}
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                canConfirm ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-300 cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      </div>

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={handleSelectImageFromMediateca}
        initialPath={BANNERS_MEDIA_LIBRARY_PATH}
      />
    </>
  );
};

export default AddBannerModal;

