"use client";

import React, { FC, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  subtitle: string;
  onBackdropClose: () => void;
  error: string | null;
}>;

export const ArticleRelateModalShell: FC<Props> = ({
  subtitle,
  onBackdropClose,
  error,
  children,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onBackdropClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="article-relate-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 id="article-relate-modal-title" className="text-xl font-bold text-gray-800">
              Relate to article
            </h2>
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onBackdropClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
};
