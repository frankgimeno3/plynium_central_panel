"use client";

import React, { FC, useEffect, useState } from "react";

interface AdSectionModalProps {
  isOpen: boolean;
  sectionType?: 'top' | 'right' | 'medium';
  onConfirm: (sectionName: string, sectionRoute: string, bannerSrc?: string) => void;
  onCancel: () => void;
}

const AdSectionModal: FC<AdSectionModalProps> = ({
  isOpen,
  sectionType = 'right',
  onConfirm,
  onCancel,
}) => {
  const [sectionName, setSectionName] = useState<string>("");
  const [sectionRoute, setSectionRoute] = useState<string>("");
  const [bannerSrc, setBannerSrc] = useState<string>("");
  const [routeError, setRouteError] = useState<string>("");
  const [srcError, setSrcError] = useState<string>("");

  const validateRoute = (route: string): string => {
    const trimmedRoute = route.trim();
    
    if (!trimmedRoute) {
      return "Route is required";
    }
    
    if (!trimmedRoute.startsWith("/")) {
      return "Route must start with '/'";
    }
    
    if (trimmedRoute !== trimmedRoute.toLowerCase()) {
      return "Route must be all lowercase";
    }
    
    // Valid route format: starts with /, followed by alphanumeric, hyphens, slashes
    const routePattern = /^\/[a-z0-9\/-]*$/;
    if (!routePattern.test(trimmedRoute)) {
      return "Route format is invalid. Use only lowercase letters, numbers, hyphens, and slashes";
    }
    
    // Check for consecutive slashes (except at the start)
    if (/\/{2,}/.test(trimmedRoute.substring(1))) {
      return "Route cannot contain consecutive slashes";
    }
    
    return "";
  };

  const validateSrc = (src: string): string => {
    const trimmedSrc = src.trim();
    
    if (!trimmedSrc) {
      return "Banner source URL is required";
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

  const handleCreate = () => {
    const trimmedName = sectionName.trim();
    const trimmedRoute = sectionRoute.trim();
    const trimmedSrc = bannerSrc.trim();
    const routeError = validateRoute(trimmedRoute);
    const srcError = (sectionType === 'top' || sectionType === 'medium') ? validateSrc(trimmedSrc) : "";
    
    if (trimmedName && trimmedRoute && !routeError) {
      if (sectionType === 'top' || sectionType === 'medium') {
        if (trimmedSrc && !srcError) {
          onConfirm(trimmedName, trimmedRoute, trimmedSrc);
          setSectionName("");
          setSectionRoute("");
          setBannerSrc("");
          setRouteError("");
          setSrcError("");
        }
      } else {
        onConfirm(trimmedName, trimmedRoute);
        setSectionName("");
        setSectionRoute("");
        setRouteError("");
      }
    }
  };

  const canCreate = sectionName.trim() !== "" && 
                    sectionRoute.trim() !== "" && 
                    routeError === "" &&
                    (sectionType === 'right' || ((sectionType === 'top' || sectionType === 'medium') && bannerSrc.trim() !== "" && srcError === ""));

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSectionName("");
      setSectionRoute("");
      setBannerSrc("");
      setRouteError("");
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
        const name = sectionName.trim();
        const route = sectionRoute.trim();
        const src = bannerSrc.trim();
        const routeError = validateRoute(route);
        const srcError = sectionType === 'top' ? validateSrc(src) : "";
        const isValid = name !== "" && route !== "" && routeError === "" && 
                       (sectionType === 'right' || (sectionType === 'top' && src !== "" && srcError === ""));
        
        if (isValid) {
          event.preventDefault();
          if (sectionType === 'top') {
            onConfirm(name, route, src);
          } else {
            onConfirm(name, route);
          }
          setSectionName("");
          setSectionRoute("");
          setBannerSrc("");
          setRouteError("");
          setSrcError("");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onCancel, onConfirm, sectionName, sectionRoute, bannerSrc, sectionType]);

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    onCancel();
  };

  const handleModalClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
  };

  const handleRouteChange = (value: string) => {
    setSectionRoute(value);
    const error = validateRoute(value);
    setRouteError(error);
  };

  const handleSrcChange = (value: string) => {
    setBannerSrc(value);
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
          Add Custom Banner Section
        </h2>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Section Name
          </label>
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={sectionName}
            onChange={(event) => setSectionName(event.target.value)}
            placeholder="Enter section name"
          />
        </div>

        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Section Route
          </label>
          <input
            type="text"
            className={`w-full rounded-md border p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
              routeError
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }`}
            value={sectionRoute}
            onChange={(event) => handleRouteChange(event.target.value)}
            placeholder="/example-route"
          />
          {routeError && (
            <p className="mt-1 text-xs text-red-500">{routeError}</p>
          )}
        </div>

        {(sectionType === 'top' || sectionType === 'medium') && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Banner Image Source
            </label>
            <input
              type="text"
              className={`w-full rounded-md border p-2 text-sm text-gray-700 focus:outline-none focus:ring-1 ${
                srcError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              }`}
              value={bannerSrc}
              onChange={(event) => handleSrcChange(event.target.value)}
              placeholder="https://example.com/image.jpg"
            />
            {srcError && (
              <p className="mt-1 text-xs text-red-500">{srcError}</p>
            )}
          </div>
        )}

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
            onClick={handleCreate}
            disabled={!canCreate}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              canCreate
                ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                : "bg-blue-300 cursor-not-allowed"
            }`}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdSectionModal;
