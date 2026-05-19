"use client";

import React from "react";

export type DataSaveErrorAlertProps = {
  saveError: string | null;
};

export function DataSaveErrorAlert({ saveError }: DataSaveErrorAlertProps) {
  if (!saveError) {
    return null;
  }
  return (
    <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
      {saveError}
    </div>
  );
}
