"use client";

import React, { FC } from "react";
import { ALLOWED_TARGET_POSITIONS } from "./constants";
import type { ConflictMessage, ReservedConflict } from "./types";

type MoveContentTypeFormProps = {
  currentPosition: string;
  target: string;
  submitting: boolean;
  conflictMessage: ConflictMessage | null;
  reservedConflict: ReservedConflict | null;
  manualRepositionEnabled: boolean;
  displacedTarget: string;
  displacedTargetOptions: { value: string; label: string }[];
  error: string | null;
  onTargetChange: (value: string) => void;
  onManualRepositionToggle: () => void;
  onDisplacedTargetChange: (value: string) => void;
};

const MoveContentTypeForm: FC<MoveContentTypeFormProps> = ({
  currentPosition,
  target,
  submitting,
  conflictMessage,
  reservedConflict,
  manualRepositionEnabled,
  displacedTarget,
  displacedTargetOptions,
  error,
  onTargetChange,
  onManualRepositionToggle,
  onDisplacedTargetChange,
}) => (
  <div className="p-6 flex flex-col gap-4">
    <div>
      <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
        Current page
      </label>
      <input
        type="text"
        value={currentPosition || "— (not set)"}
        readOnly
        className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-lg text-gray-800 cursor-not-allowed"
      />
    </div>

    <div>
      <label
        htmlFor="move-content-type-target"
        className="block text-xs uppercase tracking-wide text-gray-500 mb-1"
      >
        Change for page
      </label>
      <select
        id="move-content-type-target"
        value={target}
        onChange={(e) => onTargetChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={submitting}
      >
        <option value="">Select target page…</option>
        {ALLOWED_TARGET_POSITIONS.map((position) => (
          <option key={position.value} value={position.value}>
            {position.label}
          </option>
        ))}
      </select>
    </div>

    {conflictMessage ? (
      <div
        className={
          conflictMessage.tone === "warning"
            ? "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            : conflictMessage.tone === "error"
              ? "rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              : conflictMessage.tone === "success"
                ? "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
                : "rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800"
        }
      >
        {conflictMessage.text}
      </div>
    ) : null}

    {reservedConflict ? (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-700">
            Reposition the {reservedConflict.otherLabel} manually?
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${
                manualRepositionEnabled ? "text-gray-500" : "font-medium text-gray-900"
              }`}
            >
              No
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={manualRepositionEnabled}
              aria-label={`Reposition the ${reservedConflict.otherLabel} manually`}
              onClick={onManualRepositionToggle}
              disabled={submitting}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                manualRepositionEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  manualRepositionEnabled ? "translate-x-5" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${
                manualRepositionEnabled ? "font-medium text-gray-900" : "text-gray-500"
              }`}
            >
              Yes
            </span>
          </div>
        </div>

        {manualRepositionEnabled ? (
          <div>
            <label
              htmlFor="move-content-type-displaced-target"
              className="mb-1 block text-xs uppercase tracking-wide text-gray-500"
            >
              Move {reservedConflict.otherLabel} to
            </label>
            <select
              id="move-content-type-displaced-target"
              value={displacedTarget}
              onChange={(event) => onDisplacedTargetChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value="">Select page for the {reservedConflict.otherLabel}…</option>
              {displacedTargetOptions.map((position) => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
    ) : null}

    {error ? (
      <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
        {error}
      </div>
    ) : null}
  </div>
);

export default MoveContentTypeForm;
