"use client";

import React, { FC } from "react";
import type { Channel, FormState, ServiceGroupRow } from "./create_service_types";
import { channelLabel } from "./create_service_helpers";

type CreateServiceStepNameReviewProps = {
  form: FormState;
  selectedGroup: ServiceGroupRow | null;
  displayId: string;
  suggestedName: string;
  createError: string | null;
  submitting: boolean;
  canCreate: boolean;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onBack: () => void;
  onCreate: () => void | Promise<void>;
};

export const CreateServiceStepNameReview: FC<CreateServiceStepNameReviewProps> = ({
  form,
  selectedGroup,
  displayId,
  suggestedName,
  createError,
  submitting,
  canCreate,
  setForm,
  onBack,
  onCreate,
}) => (
  <div className="space-y-6 max-w-3xl">
    <div>
      <label className="block text-xs text-gray-600 mb-1">
        Service name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        value={form.final_service_name}
        onChange={(e) => setForm((f) => ({ ...f, final_service_name: e.target.value }))}
        placeholder={suggestedName || "Enter service name"}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
      />
      {!!suggestedName && (
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, final_service_name: suggestedName }))}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Use suggested: {suggestedName}
        </button>
      )}
    </div>

    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-sm font-semibold text-gray-700 mb-1">Review</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <p className="text-xs text-gray-500 uppercase">Service ID</p>
          <p className="font-mono text-sm">{displayId}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase">Name</p>
          <p className="text-sm">{form.final_service_name || "—"}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Channel / group</p>
          <p className="text-sm">
            {form.service_group_channel ? channelLabel(form.service_group_channel as Channel) : "—"} ·{" "}
            {selectedGroup?.service_group_name ?? "—"}
          </p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Description</p>
          <p className="text-sm whitespace-pre-wrap">{form.service_description}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-xs text-gray-500 uppercase">Specifications</p>
          <p className="text-sm whitespace-pre-wrap">{form.service_unit_specifications}</p>
        </div>
      </div>
    </div>

    {createError && (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{createError}</div>
    )}

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onBack}
        disabled={submitting}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => void onCreate()}
        disabled={submitting || !canCreate}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Creating…" : "Create service"}
      </button>
    </div>
  </div>
);
