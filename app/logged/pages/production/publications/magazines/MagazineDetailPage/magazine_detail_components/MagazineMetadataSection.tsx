"use client";

import React, { FC } from "react";
import type { Magazine } from "@/app/contents/interfaces";
import { PERIODICITY_OPTIONS } from "./constants";

type Props = {
  magazine: Magazine;
  editableName: string;
  editableSubtitle: string;
  editableDescription: string;
  editablePeriodicity: string;
  editableSubscriberNumber: string;
  saveBar: React.ReactNode;
  onNameChange: (v: string) => void;
  onSubtitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onPeriodicityChange: (v: string) => void;
  onSubscriberNumberChange: (v: string) => void;
  onOpenDeleteModal: () => void;
};

export const MagazineMetadataSection: FC<Props> = ({
  magazine,
  editableName,
  editableSubtitle,
  editableDescription,
  editablePeriodicity,
  editableSubscriberNumber,
  saveBar,
  onNameChange,
  onSubtitleChange,
  onDescriptionChange,
  onPeriodicityChange,
  onSubscriberNumberChange,
  onOpenDeleteModal,
}) => (
  <div className="bg-white rounded-b-lg overflow-hidden">
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <p className="text-xs text-gray-500 uppercase">ID</p>
          <p className="font-mono text-gray-900">{magazine.id_magazine}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Name</p>
          <input
            type="text"
            value={editableName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
          />
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Magazine subtitle</p>
          <input
            type="text"
            value={editableSubtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            placeholder="Example: Plano e industrias afines"
          />
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Description</p>
          <textarea
            value={editableDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Starting year</p>
          <p className="text-gray-900">{magazine.first_year ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Periodicity</p>
          <select
            value={PERIODICITY_OPTIONS.some((o) => o.value === editablePeriodicity) ? editablePeriodicity : ""}
            onChange={(e) => onPeriodicityChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          >
            <option value="">— Select —</option>
            {PERIODICITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Subscribers</p>
          <input
            type="number"
            min={0}
            value={editableSubscriberNumber}
            onChange={(e) => onSubscriberNumberChange(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            placeholder="—"
          />
        </div>
      </div>
      {saveBar}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Danger zone</h3>
        <p className="mt-1 text-sm text-gray-600">Permanently remove this magazine. This cannot be undone.</p>
        <button type="button" onClick={onOpenDeleteModal} className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
          Delete magazine
        </button>
      </div>
    </div>
  </div>
);
