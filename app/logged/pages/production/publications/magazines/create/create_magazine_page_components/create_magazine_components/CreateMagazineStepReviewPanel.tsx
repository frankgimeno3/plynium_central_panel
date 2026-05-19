"use client";

import React, { FC } from "react";
import type { IssueFormRow } from "./types";

type Props = {
  idMagazine: string;
  nextFallbackId: string;
  name: string;
  description: string;
  startingYear: string;
  periodicity: string;
  subscriberNumber: string;
  issues: IssueFormRow[];
  submitting: boolean;
  onBack: () => void;
  onCancel: () => void;
};

export const CreateMagazineStepReviewPanel: FC<Props> = ({
  idMagazine,
  nextFallbackId,
  name,
  description,
  startingYear,
  periodicity,
  subscriberNumber,
  issues,
  submitting,
  onBack,
  onCancel,
}) => (
  <div className="space-y-6">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-sm font-semibold text-gray-700 mb-4">Magazine review</p>
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-gray-500">Magazine ID</dt>
          <dd className="font-medium font-mono">{idMagazine || nextFallbackId}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Name</dt>
          <dd className="font-medium">{name || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Description</dt>
          <dd className="font-medium whitespace-pre-wrap">{description || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Starting year</dt>
          <dd className="font-medium">{startingYear || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Periodicity</dt>
          <dd className="font-medium">{periodicity.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Subscriber number</dt>
          <dd className="font-medium">{subscriberNumber.trim() || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Issues this year</dt>
          <dd className="font-medium">
            {issues.length > 0 ? `${issues.length} issue(s)${issues.some((i) => i.is_special_edition) ? " (including special editions)" : ""}` : "—"}
          </dd>
        </div>
        {issues.length > 0 && (
          <div>
            <dt className="text-gray-500 mb-1">Issues summary</dt>
            <dd className="text-gray-700">
              <ul className="list-disc list-inside space-y-0.5">
                {issues.map((i) => (
                  <li key={i.key}>
                    Issue #{i.issue_number}
                    {i.forecasted_publication_month != null
                      ? ` — ${new Date(2000, i.forecasted_publication_month - 1, 1).toLocaleString("default", { month: "long" })}`
                      : ""}
                    {i.is_special_edition && i.special_topic ? ` — Special: ${i.special_topic}` : i.is_special_edition ? " — Special edition" : ""}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>
    </div>

    <div className="flex gap-3">
      <button type="button" onClick={onBack} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
        Back
      </button>
      <button
        type="submit"
        disabled={submitting}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving…" : "Create magazine"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
);
