"use client";

import React, { FC } from "react";

type ArticleBuilderLoadingViewProps = {
  label?: string;
  compact?: boolean;
};

export const ArticleBuilderLoadingView: FC<ArticleBuilderLoadingViewProps> = ({
  label = "Loading article",
  compact = false,
}) => (
  <div
    className={`flex flex-col items-center justify-center ${
      compact ? "py-12" : "min-h-[min(58vh,32rem)] px-6 py-20"
    }`}
    aria-busy="true"
    aria-live="polite"
  >
    <div className="w-full max-w-md space-y-6 rounded-2xl border border-gray-200/90 bg-white px-8 py-10 shadow-sm">
      <div className="space-y-1 text-center">
        <p className="text-base font-semibold tracking-tight text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">Preparing the article builder…</p>
      </div>

      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200/80"
        role="progressbar"
        aria-label={label}
      >
        <div className="article-builder-loading-fill h-full rounded-full bg-gradient-to-r from-blue-950 via-blue-800 to-blue-600" />
      </div>

      <div className="flex justify-center gap-1.5" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="article-builder-loading-dot h-1.5 w-1.5 rounded-full bg-blue-900/70"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>

    <style>{`
      @keyframes article-builder-loading-fill {
        0% {
          width: 0%;
          opacity: 0.85;
        }
        15% {
          width: 12%;
        }
        45% {
          width: 52%;
        }
        70% {
          width: 78%;
        }
        88% {
          width: 94%;
        }
        100% {
          width: 100%;
          opacity: 1;
        }
      }
      .article-builder-loading-fill {
        animation: article-builder-loading-fill 2.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
      @keyframes article-builder-loading-dot {
        0%,
        80%,
        100% {
          transform: scale(0.65);
          opacity: 0.35;
        }
        40% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .article-builder-loading-dot {
        animation: article-builder-loading-dot 1.2s ease-in-out infinite;
      }
    `}</style>
  </div>
);
