"use client";

import React, { FC } from "react";

type Props = {
  displayId: string;
  name: string;
  description: string;
  canAdvanceStep1: boolean;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onNext: () => void;
};

export const CreateMagazineStepBasicsForm: FC<Props> = ({
  displayId,
  name,
  description,
  canAdvanceStep1,
  onNameChange,
  onDescriptionChange,
  onNext,
}) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-sm font-semibold text-gray-700 mb-1">Magazine ID</p>
      <p className="text-base font-mono font-medium text-gray-900">{displayId}</p>
      <p className="text-xs text-gray-500 mt-1">This ID will be assigned to the new magazine.</p>
    </div>

    <div>
      <label htmlFor="create-mag-name" className="block text-xs text-gray-600 mb-1">
        Name <span className="text-red-500">*</span>
      </label>
      <input
        id="create-mag-name"
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Magazine name"
      />
    </div>

    <div>
      <label htmlFor="create-mag-description" className="block text-xs text-gray-600 mb-1">
        Description
      </label>
      <textarea
        id="create-mag-description"
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Optional description"
      />
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvanceStep1}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next: Starting year, details and issues
      </button>
    </div>
  </div>
);
