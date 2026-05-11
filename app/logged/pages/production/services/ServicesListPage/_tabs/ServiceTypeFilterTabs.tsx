"use client";

import React, { FC } from "react";

export type ServiceTypeTabItem = { value: string; label: string };

type ServiceTypeFilterTabsProps = {
  tabs: ServiceTypeTabItem[];
  activeServiceType: string;
  onSelect: (value: string) => void;
};

export const ServiceTypeFilterTabs: FC<ServiceTypeFilterTabsProps> = ({
  tabs,
  activeServiceType,
  onSelect,
}) => (
  <div className="flex flex-wrap gap-2 mb-6">
    {tabs.map((t) => {
      const isActive = activeServiceType === t.value;
      return (
        <button
          key={t.value || "all"}
          type="button"
          onClick={() => onSelect(t.value)}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            isActive ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {t.label}
        </button>
      );
    })}
  </div>
);
