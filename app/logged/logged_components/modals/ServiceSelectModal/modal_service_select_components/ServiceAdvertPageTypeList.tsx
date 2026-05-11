"use client";

import React, { FC } from "react";
import { SERVICE_SELECT_PAGE_TYPES } from "./constants";

type Props = {
  magazinePageType: string;
  magazineSlotKey: string;
  onSelectPage: (pageType: string, slotKey: string, available: boolean) => void;
};

export const ServiceAdvertPageTypeList: FC<Props> = ({
  magazineSlotKey,
  onSelectPage,
}) => (
  <div className="pt-3">
    <label className="block text-xs text-gray-600 mb-2">Page type</label>
    <div className="space-y-2">
      {SERVICE_SELECT_PAGE_TYPES.map(({ pageType, slotKey }) => (
        <button
          key={slotKey}
          type="button"
          onClick={() => onSelectPage(pageType, slotKey, true)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${
            magazineSlotKey === slotKey
              ? "border-blue-600 bg-blue-50 text-blue-900"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span>{pageType}</span>
          <span className="text-xs">Select</span>
        </button>
      ))}
    </div>
  </div>
);
