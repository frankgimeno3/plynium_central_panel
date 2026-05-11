"use client";

import React, { FC } from "react";
import type { Step } from "./create_service_types";

type CreateServiceWizardHeaderProps = {
  step: Step;
  onJumpToCompletedStep: (s: Step) => void;
};

export const CreateServiceWizardHeader: FC<CreateServiceWizardHeaderProps> = ({
  step,
  onJumpToCompletedStep,
}) => (
  <div className="flex border-b border-gray-200 bg-gray-50">
    <div className="p-6 flex-1">
      <div className="flex items-center gap-4">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <React.Fragment key={s}>
            <button
              type="button"
              onClick={() => s < step && onJumpToCompletedStep(s)}
              className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
              } ${step > s ? "cursor-pointer" : ""}`}
            >
              {s}
            </button>
            {s < 4 && <span className="w-8 h-0.5 bg-gray-300" aria-hidden="true" />}
          </React.Fragment>
        ))}
        <span className="text-sm text-gray-600 ml-2">
          {step === 1 && "Channel + service group"}
          {step === 2 && "Custom fields"}
          {step === 3 && "Description + specifications"}
          {step === 4 && "Name + review"}
        </span>
      </div>
    </div>
  </div>
);
