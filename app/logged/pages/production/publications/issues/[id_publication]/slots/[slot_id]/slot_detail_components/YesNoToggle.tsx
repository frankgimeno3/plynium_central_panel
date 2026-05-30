"use client";

import React, { FC } from "react";

export type YesNoToggleProps = {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
};

/** Fixed No (left) / Yes (right) labels; only the switch thumb moves. */
export const YesNoToggle: FC<YesNoToggleProps> = ({ label, checked, disabled, onChange }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
    <span className="shrink-0 text-sm text-gray-700">{label}</span>
    <div className="inline-flex shrink-0 items-center gap-2">
      <span
        className={`min-w-[1.75rem] shrink-0 text-right text-sm ${
          checked ? "font-normal text-gray-500" : "font-semibold text-gray-900"
        }`}
        aria-hidden
      >
        No
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? "Yes" : "No"}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-blue-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
      <span
        className={`min-w-[1.75rem] shrink-0 text-sm ${
          checked ? "font-semibold text-gray-900" : "font-normal text-gray-500"
        }`}
        aria-hidden
      >
        Yes
      </span>
    </div>
  </div>
);
