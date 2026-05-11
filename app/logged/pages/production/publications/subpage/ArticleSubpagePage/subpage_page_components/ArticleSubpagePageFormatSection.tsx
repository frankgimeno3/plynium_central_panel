import React, { FC } from "react";
import { PAGE_FORMAT_OPTIONS } from "./types";

type ArticleSubpagePageFormatSectionProps = {
  pageFormatDraft: string;
  onPageFormatChange: (formatId: string) => void;
};

export const ArticleSubpagePageFormatSection: FC<ArticleSubpagePageFormatSectionProps> = ({
  pageFormatDraft,
  onPageFormatChange,
}) => {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-gray-800">Page format</h2>
      <p className="text-xs text-gray-500 mb-3">
        Pick the layout used to render this page in the magazine. The current chunks adapt to the
        chosen format.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {PAGE_FORMAT_OPTIONS.map((opt) => {
          const active = pageFormatDraft === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPageFormatChange(opt.id)}
              className={`text-left rounded-lg border px-3 py-2 transition ${
                active
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{opt.label}</p>
              <p className="text-[11px] text-gray-500">{opt.description}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
};
