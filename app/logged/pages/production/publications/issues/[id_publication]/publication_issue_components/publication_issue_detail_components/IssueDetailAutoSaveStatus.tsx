"use client";

import { FC } from "react";

export type IssueDetailAutoSaveStatusProps = {
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  hasPubChanges: boolean;
};

export const IssueDetailAutoSaveStatus: FC<IssueDetailAutoSaveStatusProps> = ({
  autoSaveStatus,
  hasPubChanges,
}) => {
  if (autoSaveStatus === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-500">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
        Saving…
      </span>
    );
  }
  if (autoSaveStatus === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Saved
      </span>
    );
  }
  if (autoSaveStatus === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
        Save failed
      </span>
    );
  }
  if (hasPubChanges) {
    return (
      <span className="inline-flex items-center gap-1.5 text-gray-400">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
        Pending…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-gray-400">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-300" />
      All changes saved
    </span>
  );
};
