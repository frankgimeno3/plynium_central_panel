"use client";

import React, { FC } from "react";
import type { WizardStep } from "../preferential_generate_types";
import { WIZARD_STEP_LABELS } from "../preferential_generate_types";

type WizardStepIndicatorProps = {
  step: WizardStep;
};

export const WizardStepIndicator: FC<WizardStepIndicatorProps> = ({ step }) => (
  <ol className="mt-4 flex flex-wrap gap-2">
    {([1, 2, 3, 4, 5] as const).map((id) => {
      const active = step === id;
      const completed = step > id;
      return (
        <li
          key={id}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            active
              ? "border-blue-950 bg-blue-950 text-white"
              : completed
                ? "border-blue-200 bg-blue-50 text-blue-900"
                : "border-gray-200 bg-gray-50 text-gray-600"
          }`}
        >
          {id}. {WIZARD_STEP_LABELS[id]}
        </li>
      );
    })}
  </ol>
);
