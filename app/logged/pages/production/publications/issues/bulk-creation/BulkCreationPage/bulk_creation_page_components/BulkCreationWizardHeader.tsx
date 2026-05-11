"use client";

import React, { FC } from "react";
import type { WizardStep } from "./constants";
import { stepLabels } from "./constants";

export type BulkCreationWizardHeaderProps = {
  horizonEndLabel: string;
  step: WizardStep;
};

export const BulkCreationWizardHeader: FC<BulkCreationWizardHeaderProps> = ({ horizonEndLabel, step }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-6">
    <p className="text-sm text-gray-600">
      Generate missing magazine issues from today through {horizonEndLabel}. Existing issues in the database are detected
      automatically and skipped.
    </p>
    <ol className="mt-4 flex flex-wrap gap-2">
      {([1, 2, 3, 4] as const).map((id) => {
        const active = step === id;
        const completed = step > id;
        return (
          <li
            key={id}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              active
                ? "bg-blue-950 text-white border-blue-950"
                : completed
                  ? "bg-blue-50 text-blue-900 border-blue-200"
                  : "bg-gray-50 text-gray-600 border-gray-200"
            }`}
          >
            {id}. {stepLabels[id]}
          </li>
        );
      })}
    </ol>
  </div>
);
