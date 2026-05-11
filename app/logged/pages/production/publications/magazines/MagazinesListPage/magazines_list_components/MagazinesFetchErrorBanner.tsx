"use client";

import React, { FC } from "react";

type Props = {
  message: string;
  onRetry: () => void;
};

export const MagazinesFetchErrorBanner: FC<Props> = ({ message, onRetry }) => (
  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between gap-4">
    <p className="text-sm text-red-800">{message}</p>
    <button
      type="button"
      onClick={onRetry}
      className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
    >
      Retry
    </button>
  </div>
);
