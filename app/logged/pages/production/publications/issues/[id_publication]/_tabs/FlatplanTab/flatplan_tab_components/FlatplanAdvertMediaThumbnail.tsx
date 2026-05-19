"use client";

import React, { FC, useEffect, useState } from "react";
import { isPdfMediaUrl } from "@/lib/media/isPdfMediaUrl";

const thumbCache = new Map<string, string>();

type FlatplanAdvertMediaThumbnailProps = {
  url: string;
  className?: string;
};

/**
 * Low-resolution flatplan background for advert slots (image URL or PDF first page).
 */
export const FlatplanAdvertMediaThumbnail: FC<FlatplanAdvertMediaThumbnailProps> = ({
  url,
  className = "absolute inset-1 max-h-[calc(100%-0.5rem)] max-w-[calc(100%-0.5rem)] m-auto object-contain opacity-50 transition-opacity duration-150 group-hover/flatplan-tile:opacity-65",
}) => {
  const trimmed = String(url ?? "").trim();
  const isPdf = isPdfMediaUrl(trimmed);

  const [thumbSrc, setThumbSrc] = useState<string | null>(() => {
    if (!trimmed) return null;
    if (!isPdf) return trimmed;
    return thumbCache.get(trimmed) ?? null;
  });

  useEffect(() => {
    if (!trimmed) {
      setThumbSrc(null);
      return;
    }
    if (!isPdf) {
      setThumbSrc(trimmed);
      return;
    }

    const cached = thumbCache.get(trimmed);
    if (cached) {
      setThumbSrc(cached);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        }
        const task = pdfjs.getDocument({ url: trimmed, withCredentials: false });
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const scale = 0.2;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        await page.render({ canvasContext: ctx, viewport, canvas }).promise;
        const dataUrl = canvas.toDataURL("image/jpeg", 0.55);
        thumbCache.set(trimmed, dataUrl);
        if (!cancelled) setThumbSrc(dataUrl);
      } catch {
        if (!cancelled) setThumbSrc(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [trimmed, isPdf]);

  if (!trimmed) return null;

  if (thumbSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- mediateca / generated JPEG thumb
      <img src={thumbSrc} alt="" className={className} loading="lazy" decoding="async" />
    );
  }

  if (isPdf) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-red-50/90 text-red-800 font-bold ${className}`}
        aria-hidden
      >
        <span className="text-[9px] uppercase tracking-wide">PDF</span>
      </div>
    );
  }

  return null;
};
