"use client";

import React, { FC, useEffect, useState } from "react";
import { addOneYearYmd, splitYmd, todayYmd, ymdFromParts } from "../bannerDateUtils";

interface AdSectionModalProps {
  isOpen: boolean;
  sectionType?: 'top' | 'right' | 'medium';
  onConfirm: (
    sectionName: string,
    sectionRoute: string,
    bannerSrc?: string,
    schedule?: { startsAt: string; endsAt: string }
  ) => void;
  onCancel: () => void;
}

const emptyParts = () => ({ dd: '', mm: '', yyyy: '' });

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
  const [startParts, setStartParts] = useState(emptyParts());
  const [endParts, setEndParts] = useState(emptyParts());
  const [scheduleError, setScheduleError] = useState<string>("");

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
    
    const routePattern = /^\/[a-z0-9\/-]*$/;
    if (!routePattern.test(trimmedRoute)) {
      return "Route format is invalid. Use only lowercase letters, numbers, hyphens, and slashes";
    }
    
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
    
    const urlPattern = /^(https?:\/\/|data:)/i;
    if (!urlPattern.test(trimmedSrc)) {
      return "Source must be a valid URL (http:// or https://) or data URI";
    }
    
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
    const routeErr = validateRoute(trimmedRoute);
    const srcErr = (sectionType === 'top' || sectionType === 'medium') ? validateSrc(trimmedSrc) : "";
    setScheduleError("");
    
    if (trimmedName && trimmedRoute && !routeErr) {
      if (sectionType === 'top' || sectionType === 'medium') {
        const startIso = ymdFromParts(startParts.dd, startParts.mm, startParts.yyyy);
        const endIso = ymdFromParts(endParts.dd, endParts.mm, endParts.yyyy);
        if (!startIso || !endIso) {
          setScheduleError('Enter valid day, month and year for both start and end.');
          return;
        }
        if (endIso < startIso) {
          setScheduleError('End date must be on or after start date.');
          return;
        }
        if (trimmedSrc && !srcErr) {
          onConfirm(trimmedName, trimmedRoute, trimmedSrc, { startsAt: startIso, endsAt: endIso });
          resetForm();
        }
      } else {
        onConfirm(trimmedName, trimmedRoute);
        resetForm();
      }
    }
  };

  const resetForm = () => {
    setSectionName("");
    setSectionRoute("");
    setBannerSrc("");
    setRouteError("");
    setSrcError("");
    setScheduleError("");
    const t = todayYmd();
    const e = addOneYearYmd(t);
    setStartParts(splitYmd(t));
    setEndParts(splitYmd(e));
  };

  const needsSchedule = sectionType === 'top' || sectionType === 'medium';
  const startIso = ymdFromParts(startParts.dd, startParts.mm, startParts.yyyy);
  const endIso = ymdFromParts(endParts.dd, endParts.mm, endParts.yyyy);
  const datesOk =
    !needsSchedule ||
    (startIso != null &&
      endIso != null &&
      endIso >= startIso);

  const canCreate =
    sectionName.trim() !== "" &&
    sectionRoute.trim() !== "" &&
    routeError === "" &&
    (sectionType === 'right' ||
      (needsSchedule &&
        bannerSrc.trim() !== "" &&
        srcError === "" &&
        datesOk));

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

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

  const dateRow = (
    label: string,
    parts: { dd: string; mm: string; yyyy: string },
    setParts: React.Dispatch<React.SetStateAction<{ dd: string; mm: string; yyyy: string }>>
  ) => (
    <div className="mb-3">
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="dd"
          maxLength={2}
          className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
          value={parts.dd}
          onChange={(e) => setParts((p) => ({ ...p, dd: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
        />
        <span className="text-gray-500">/</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="mm"
          maxLength={2}
          className="w-14 rounded border border-gray-300 px-2 py-1 text-sm"
          value={parts.mm}
          onChange={(e) => setParts((p) => ({ ...p, mm: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
        />
        <span className="text-gray-500">/</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="yyyy"
          maxLength={4}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
          value={parts.yyyy}
          onChange={(e) => setParts((p) => ({ ...p, yyyy: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
        />
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={handleModalClick}
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
          <>
            <div className="mb-4">
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
            <p className="mb-2 text-sm text-gray-600">Campaign dates (dd / mm / yyyy, required)</p>
            {dateRow('Start date', startParts, setStartParts)}
            {dateRow('End date', endParts, setEndParts)}
            {scheduleError ? (
              <p className="mb-3 text-xs text-red-500">{scheduleError}</p>
            ) : null}
          </>
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
