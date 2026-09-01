"use client";

import React, { FC } from "react";
import type { FormState } from "./create_service_types";

type CreateServiceStepDescriptionProps = {
  form: FormState;
  canAdvanceStep3: boolean;
  showPriceAndSpecs?: boolean;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onBack: () => void;
  onNext: () => void;
};

export const CreateServiceStepDescription: FC<CreateServiceStepDescriptionProps> = ({
  form,
  canAdvanceStep3,
  showPriceAndSpecs = false,
  setForm,
  onBack,
  onNext,
}) => (
  <div className="space-y-6 max-w-3xl">
    {form.created_from_other && (
      <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-gray-800" role="note">
        <p className="font-medium text-gray-900 mb-1">Based on general service</p>
        <p>
          Description and specifications were loaded from the selected general service. You can edit them here for this
          specific instance.
        </p>
      </div>
    )}

    <div>
      <label className="block text-xs text-gray-600 mb-1">
        Description <span className="text-red-500">*</span>
      </label>
      <textarea
        value={form.service_description}
        onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))}
        rows={10}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
      />
    </div>

    <div>
      <label className="block text-xs text-gray-600 mb-1">Specifications</label>
      <textarea
        value={form.service_unit_specifications}
        onChange={(e) => setForm((f) => ({ ...f, service_unit_specifications: e.target.value }))}
        rows={8}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
      />
    </div>

    {showPriceAndSpecs && (
      <div>
        <label className="block text-xs text-gray-600 mb-1">Standard price (€)</label>
        <input
          type="number"
          min={0}
          step={0.01}
          value={form.service_unit_price || ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            setForm((f) => ({ ...f, service_unit_price: Number.isNaN(v) ? 0 : v }));
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
        />
      </div>
    )}

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
      >
        Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvanceStep3}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next: Review
      </button>
    </div>
  </div>
);
