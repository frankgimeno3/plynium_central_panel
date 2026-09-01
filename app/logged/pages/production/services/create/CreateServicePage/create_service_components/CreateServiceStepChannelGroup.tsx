"use client";

import React, { FC } from "react";
import type { Channel, FormState, GeneralServiceRow } from "./create_service_types";
import { channelLabel } from "./create_service_helpers";

type CreateServiceStepChannelGroupProps = {
  form: FormState;
  displayId: string;
  channels: Channel[];
  generalServicesForChannel: GeneralServiceRow[];
  selectedParent: GeneralServiceRow | null;
  canAdvanceStep1: boolean;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onNext: () => void;
};

export const CreateServiceStepChannelGroup: FC<CreateServiceStepChannelGroupProps> = ({
  form,
  displayId,
  channels,
  generalServicesForChannel,
  selectedParent,
  canAdvanceStep1,
  setForm,
  onNext,
}) => (
  <div className="space-y-6 max-w-2xl">
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-sm font-semibold text-gray-700 mb-1">Service ID</p>
      <p className="text-base font-mono font-medium text-gray-900">{displayId}</p>
      <p className="text-xs text-gray-500 mt-1">This will be the ID assigned to the new service.</p>
    </div>

    <div>
      <label className="block text-xs text-gray-600 mb-2">Created from another service?</label>
      <div className="flex items-center gap-3">
        <span className={`text-sm font-medium ${!form.created_from_other ? "text-blue-800" : "text-gray-400"}`}>No</span>
        <button
          type="button"
          role="switch"
          aria-checked={form.created_from_other}
          aria-label={form.created_from_other ? "Created from another service: Yes" : "Created from another service: No"}
          onClick={() =>
            setForm((f) => ({
              ...f,
              created_from_other: !f.created_from_other,
              service_channel: "",
              parent_service_id: "",
              custom: null,
            }))
          }
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            form.created_from_other ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
              form.created_from_other ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${form.created_from_other ? "text-blue-800" : "text-gray-400"}`}>Yes</span>
      </div>
    </div>

    {form.created_from_other ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">
            Channel <span className="text-red-500">*</span>
          </label>
          <select
            value={form.service_channel}
            onChange={(e) => {
              const ch = e.target.value as Channel | "";
              setForm((f) => ({
                ...f,
                service_channel: ch,
                parent_service_id: "",
                custom: null,
              }));
            }}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select channel…</option>
            {channels.map((c) => (
              <option key={c} value={c}>
                {channelLabel(c)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1">
            General service <span className="text-red-500">*</span>
          </label>
          <select
            value={form.parent_service_id}
            onChange={(e) => {
              const parentId = e.target.value;
              const parent = generalServicesForChannel.find((s) => s.service_id === parentId) ?? null;
              setForm((f) => ({
                ...f,
                parent_service_id: parentId,
                custom: null,
                service_description: parent ? String(parent.service_description ?? "") : "",
                service_unit_specifications: parent ? String(parent.service_unit_specifications ?? "") : "",
                service_unit_price: parent
                  ? Number(parent.service_unit_price ?? parent.tariff_price_eur ?? 0)
                  : 0,
              }));
            }}
            disabled={!form.service_channel}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
          >
            <option value="">Select service…</option>
            {generalServicesForChannel.map((s) => (
              <option key={s.service_id} value={s.service_id}>
                {s.service_full_name}
              </option>
            ))}
          </select>
        </div>
      </div>
    ) : (
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Service channel <span className="text-red-500">*</span>
        </label>
        <select
          value={form.service_channel}
          onChange={(e) => {
            const ch = e.target.value as Channel | "";
            setForm((f) => ({ ...f, service_channel: ch, custom: null }));
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select channel…</option>
          {channels.map((c) => (
            <option key={c} value={c}>
              {channelLabel(c)}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">You are creating a new general service template for this channel.</p>
      </div>
    )}

    {form.created_from_other && selectedParent && (
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
        <p className="font-medium mb-1">Loaded from {selectedParent.service_full_name}</p>
        <p className="text-xs text-blue-800">
          Description and specifications were pre-filled from the selected general service. You can adjust them in the
          next steps.
        </p>
      </div>
    )}

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvanceStep1}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next: {form.created_from_other ? "Custom" : "Details"}
      </button>
    </div>
  </div>
);
