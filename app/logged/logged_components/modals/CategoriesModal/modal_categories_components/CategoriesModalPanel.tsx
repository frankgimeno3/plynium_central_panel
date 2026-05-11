"use client";

import React, { FC } from "react";
import type { CategoryItem } from "./types";

export type CategoriesModalPanelProps = {
  onClose: () => void;
  loading: boolean;
  categories: CategoryItem[];
  selected: CategoryItem[];
  onConfirmSelection: () => void;
  onRequestUntag: (categoryName: string) => void;
  onPickCategory: (cat: CategoryItem) => void;
};

export const CategoriesModalPanel: FC<CategoriesModalPanelProps> = ({
  onClose,
  loading,
  categories,
  selected,
  onConfirmSelection,
  onRequestUntag,
  onPickCategory,
}) => {
  const addCategory = onPickCategory;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="categories-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 id="categories-modal-title" className="text-xl font-bold text-gray-800">
            Select categories
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 min-h-0 overflow-hidden">
          <p className="text-sm text-gray-600">
            Choose one or more categories. Selected ones appear as tags below; click × to remove (with
            confirmation).
          </p>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selected.map((cat) => (
                <span
                  key={cat.id_category}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 rounded-lg text-sm font-medium"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestUntag(cat.name);
                    }}
                    className="text-blue-700 hover:text-red-700 font-bold leading-none"
                    aria-label={`Remove ${cat.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="border border-gray-200 rounded-lg overflow-auto flex-1 min-h-[200px]">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Portals
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-5 text-center text-gray-500">
                      Loading categories…
                    </td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-5 text-center text-gray-500">
                      No categories available.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const isInSelected = selected.some((c) => c.id_category === cat.id_category);
                    return (
                      <tr
                        key={cat.id_category}
                        onClick={() => addCategory(cat)}
                        className={`cursor-pointer transition-colors ${
                          isInSelected ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-100"
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {cat.name}
                          {isInSelected && <span className="ml-2 text-blue-600">✓</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(cat.portals_array || []).join(", ") || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmSelection}
              className="px-4 py-2 rounded-xl bg-blue-950 text-white font-bold hover:bg-blue-900"
            >
              Confirm selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
