"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

/** Body copy at 2× and company name at 4× this unit (scaled down together to fit the box). */
const BASE_UNIT_PX = 10;

export type ArticlePreviewCompanyBoxData = {
  company_name: string;
  company_direction?: string | null;
  company_city?: string | null;
  company_email?: string | null;
  company_phone?: string | null;
  company_web?: string | null;
};

function computeUniformFitScale(container: HTMLElement, content: HTMLElement): number {
  const maxW = container.clientWidth;
  const maxH = container.clientHeight;
  if (maxW <= 0 || maxH <= 0) return 1;

  content.style.transform = "none";
  const naturalW = content.scrollWidth;
  const naturalH = content.scrollHeight;
  if (naturalW <= 0 || naturalH <= 0) return 1;

  return Math.min(maxW / naturalW, maxH / naturalH);
}

export function ArticlePreviewCompanyBox({
  articleBox,
  onRemoveArticleBox,
}: {
  articleBox: ArticlePreviewCompanyBoxData;
  onRemoveArticleBox?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const update = () => {
      setFitScale(computeUniformFitScale(container, content));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(container);
    return () => ro.disconnect();
  }, [
    articleBox.company_name,
    articleBox.company_direction,
    articleBox.company_city,
    articleBox.company_email,
    articleBox.company_phone,
    articleBox.company_web,
  ]);

  const namePx = BASE_UNIT_PX * 4;
  const bodyPx = BASE_UNIT_PX * 2;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-sm border border-gray-600 bg-gray-200 p-5 shadow-sm">
      {onRemoveArticleBox ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveArticleBox();
          }}
          className="absolute right-1 top-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-gray-400 bg-white text-gray-700 shadow hover:bg-gray-100"
          aria-label="Remove article box"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      ) : null}

      <div ref={containerRef} className="h-full min-h-0 w-full overflow-hidden">
        <div
          ref={contentRef}
          className="inline-block max-w-full origin-top-left leading-snug text-gray-900"
          style={{
            transform: `scale(${fitScale})`,
            fontSize: `${bodyPx}px`,
          }}
        >
          <div
            className="font-semibold uppercase leading-none tracking-wide text-gray-900"
            style={{ fontSize: `${namePx}px` }}
          >
            {articleBox.company_name}
          </div>
          <div className="mt-[0.3em] space-y-[0.15em]">
            {articleBox.company_direction ? <div>{articleBox.company_direction}</div> : null}
            {articleBox.company_city ? <div>{articleBox.company_city}</div> : null}
            {articleBox.company_phone ? <div>{articleBox.company_phone}</div> : null}
            {articleBox.company_email ? <div>{articleBox.company_email}</div> : null}
            {articleBox.company_web ? (
              <div className="font-semibold">{articleBox.company_web}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
