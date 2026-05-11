"use client";

import type { CategoryItem } from "./types";

type Props = {
  selected: CategoryItem[];
  onRequestRemove: (categoryName: string) => void;
};

export function CategoriesSelectedTags({ selected, onRequestRemove }: Props) {
  if (selected.length === 0) return null;
  return (
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
              onRequestRemove(cat.name);
            }}
            className="text-blue-700 hover:text-red-700 font-bold leading-none"
            aria-label={`Remove ${cat.name}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
