"use client";

import React, { FC, useEffect, useState } from "react";

type ArticleBuilderFlatplanNameFieldProps = {
  value: string | null | undefined;
  saving: boolean;
  onSave: (next: string) => void | Promise<void>;
};

/** `publication_articles.publication_art_name` — shown on flatplan article tiles. */
export const ArticleBuilderFlatplanNameField: FC<ArticleBuilderFlatplanNameFieldProps> = ({
  value,
  saving,
  onSave,
}) => {
  const [draft, setDraft] = useState(String(value ?? ""));

  useEffect(() => {
    setDraft(String(value ?? ""));
  }, [value]);

  const commit = () => {
    const trimmed = draft.trim();
    const current = String(value ?? "").trim();
    if (trimmed === current) return;
    void onSave(trimmed);
  };

  return (
    <div className="mt-3 w-full max-w-4xl">
      <label
        htmlFor="publication-art-flatplan-name"
        className="mb-1 block text-sm font-medium text-gray-800"
      >
        Publication Article Flatplan Name
      </label>
      <input
        id="publication-art-flatplan-name"
        type="text"
        maxLength={255}
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="Shown on flatplan as: Page x/y - this name"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
      />
      {saving ? (
        <p className="mt-1 text-[10px] text-blue-600">Saving flatplan name…</p>
      ) : (
        <p className="mt-1 text-[10px] text-gray-500">
          Appears on the flatplan preview for every page of this article.
        </p>
      )}
    </div>
  );
};
