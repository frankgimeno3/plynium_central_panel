"use client";

import React, { useState } from "react";

interface ArticleCompanyDateSectionProps {
  companyNames: string[];
  companyIds: string[];
  onRemoveCompany: (index: number) => void;
  onAddCompany: (name: string, companyId: string) => void;
  onOpenDirectory: () => void;
  date: string;
  onEditDate: () => void;
  isSaving?: boolean;
}

export default function ArticleCompanyDateSection({
  companyNames,
  companyIds,
  onRemoveCompany,
  onAddCompany,
  onOpenDirectory,
  date,
  onEditDate,
  isSaving = false,
}: ArticleCompanyDateSectionProps) {
  const [nameInput, setNameInput] = useState("");
  const [idInput, setIdInput] = useState("");

  const handleAdd = () => {
    const name = nameInput.trim();
    if (!name) return;
    onAddCompany(name, idInput.trim());
    setNameInput("");
    setIdInput("");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex flex-col gap-2 md:col-span-2">
        <label className="text-lg font-bold text-gray-800">Companies *</label>
        <p className="text-sm text-gray-500">At least one company. Add manually or pick from the directory.</p>
        <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
          {companyNames.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-gray-100 border border-gray-200 text-sm text-gray-800"
            >
              <span>
                {name}
                {companyIds[i] ? (
                  <span className="text-gray-500 font-mono text-xs ml-1">({companyIds[i]})</span>
                ) : null}
              </span>
              <button
                type="button"
                disabled={isSaving || companyNames.length <= 1}
                onClick={() => onRemoveCompany(i)}
                className="p-1 rounded-full hover:bg-gray-200 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={`Remove ${name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-600">Company name</label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm"
              placeholder="Name"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium text-gray-600">Company ID (optional)</label>
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              placeholder="id_company"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSaving || !nameInput.trim()}
            className="px-4 py-2 rounded-xl bg-blue-950 text-white text-sm font-medium disabled:opacity-50"
          >
            Add
          </button>
          <button
            type="button"
            onClick={onOpenDirectory}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-blue-950 text-blue-950 text-sm font-medium hover:bg-blue-50 disabled:opacity-50"
          >
            Directory…
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-lg font-bold text-gray-800">Date</label>
        <div
          onClick={onEditDate}
          className="relative flex flex-row items-center rounded-lg border border-gray-200 bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
        >
          <p className="text-base text-gray-700 flex-1">
            {date || "Not specified"}
          </p>
        </div>
      </div>
    </div>
  );
}
