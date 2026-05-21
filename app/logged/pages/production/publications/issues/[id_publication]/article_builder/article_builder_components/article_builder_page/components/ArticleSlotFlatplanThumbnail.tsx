"use client";

import React, { FC } from "react";
import { flatplanImageUrlWithCacheBust } from "../../articleSlotFlatplanCapture";

type ArticleSlotFlatplanThumbnailProps = {
  imageUrl: string;
  className?: string;
  /** When true, slightly larger display (flatplan expanded tile). */
  previewExpanded?: boolean;
  /** Bust CDN cache after screenshot re-upload (timestamp or random). */
  cacheBust?: string | number;
};

/**
 * Stored low-res capture of an article magazine page (mediateca PNG).
 * Used by slot detail preview and flatplan tiles instead of live DOM scaling.
 */
export const ArticleSlotFlatplanThumbnail: FC<ArticleSlotFlatplanThumbnailProps> = ({
  imageUrl,
  className,
  previewExpanded = false,
  cacheBust,
}) => {
  const url = flatplanImageUrlWithCacheBust(String(imageUrl ?? "").trim(), cacheBust);
  if (!url) return null;

  const defaultClass = "block h-full w-full object-contain object-center bg-white";

  return (
    // eslint-disable-next-line @next/next/no-img-element -- mediateca CDN capture
    <img
      src={url}
      alt=""
      className={className ?? defaultClass}
      loading="lazy"
      decoding="async"
    />
  );
};
