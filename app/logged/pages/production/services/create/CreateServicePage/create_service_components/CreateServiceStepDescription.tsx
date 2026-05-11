"use client";

import React, { FC } from "react";
import type { FormState } from "./create_service_types";

type CreateServiceStepDescriptionProps = {
  form: FormState;
  canAdvanceStep3: boolean;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onBack: () => void;
  onNext: () => void;
};

export const CreateServiceStepDescription: FC<CreateServiceStepDescriptionProps> = ({
  form,
  canAdvanceStep3,
  setForm,
  onBack,
  onNext,
}) => (
  <div className="space-y-6 max-w-3xl">
    <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-4 py-3 text-sm text-gray-800" role="note">
      <p className="font-medium text-gray-900 mb-1">Inherited from service group</p>
      <p>
        Description and specifications are inherited from the service group. You can edit them here for this specific
        service. Service-specific values override the group defaults when used in proposals, and agents can still adjust
        them again on the proposal.
      </p>
    </div>

    <div>
      <label className="block text-xs text-gray-600 mb-1">Description</label>
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
