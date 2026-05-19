"use client";

import React, { FC } from "react";

type UiFormatPositionFiltersAsideProps = {
  showSold: boolean;
  onShowSoldChange: (show: boolean) => void;
  availablePositions: string[];
  visiblePositions: Record<string, boolean>;
  onVisiblePositionChange: (position: string, visible: boolean) => void;
};

export const UiFormatPositionFiltersAside: FC<UiFormatPositionFiltersAsideProps> = ({
  showSold,
  onShowSoldChange,
  availablePositions,
  visiblePositions,
  onVisiblePositionChange,
}) => (
  <aside className="w-full shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-4 lg:w-72">
    <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
    <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
      <input
        type="checkbox"
        checked={showSold}
        onChange={(event) => onShowSoldChange(event.target.checked)}
      />
      Show sold
    </label>
    <div className="mt-4 space-y-2">
      {availablePositions.map((position) => (
        <label key={position} className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={visiblePositions[position] !== false}
            onChange={(event) => onVisiblePositionChange(position, event.target.checked)}
          />
          {position}
        </label>
      ))}
      {availablePositions.length === 0 ? (
        <p className="text-sm text-gray-500">No positions loaded yet.</p>
      ) : null}
    </div>
  </aside>
);
