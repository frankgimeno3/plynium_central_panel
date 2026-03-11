"use client";

import React, { useState, useEffect } from "react";

interface ArticleTitleSectionProps {
  title: string;
  subtitle: string;
  onSaveTitleSubtitle: (newTitle: string, newSubtitle: string) => void;
  isSaving?: boolean;
}

export default function ArticleTitleSection({
  title,
  subtitle,
  onSaveTitleSubtitle,
  isSaving = false,
}: ArticleTitleSectionProps) {
  const [titleLocal, setTitleLocal] = useState(title ?? "");
  const [subtitleLocal, setSubtitleLocal] = useState(subtitle ?? "");

  useEffect(() => {
    setTitleLocal(title ?? "");
    setSubtitleLocal(subtitle ?? "");
  }, [title, subtitle]);

  const titleDirty = titleLocal !== (title ?? "");
  const subtitleDirty = subtitleLocal !== (subtitle ?? "");
  const isDirty = titleDirty || subtitleDirty;

  const handleSave = () => {
    if (!isDirty || isSaving) return;
    onSaveTitleSubtitle(titleLocal, subtitleLocal);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-lg font-bold text-gray-800">Article Title</label>
      <input
        type="text"
        value={titleLocal}
        onChange={(e) => setTitleLocal(e.target.value)}
        disabled={isSaving}
        className="w-full px-4 py-3 text-xl font-semibold border border-gray-300 rounded-xl bg-white text-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        placeholder="Article title"
      />

      <label className="text-lg font-bold text-gray-800 mt-2">Subtitle</label>
      <textarea
        value={subtitleLocal}
        onChange={(e) => setSubtitleLocal(e.target.value)}
        disabled={isSaving}
        rows={2}
        className="w-full px-4 py-3 text-base border border-gray-300 rounded-xl bg-white text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 resize-y"
        placeholder="Article subtitle"
      />

      {isDirty && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      )}
    </div>
  );
}
