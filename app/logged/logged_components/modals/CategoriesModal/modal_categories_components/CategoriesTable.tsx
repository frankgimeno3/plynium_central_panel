"use client";

import type { CategoryItem } from "./types";

type Props = {
  loading: boolean;
  categories: CategoryItem[];
  selected: CategoryItem[];
  onAddCategory: (cat: CategoryItem) => void;
};

export function CategoriesTable({ loading, categories, selected, onAddCategory }: Props) {
  return (
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
                  onClick={() => onAddCategory(cat)}
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
  );
}
