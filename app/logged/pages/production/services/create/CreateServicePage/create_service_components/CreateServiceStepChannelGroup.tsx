"use client";

import React, { FC } from "react";
import type { Channel, FormState } from "./create_service_types";
import { channelLabel } from "./create_service_helpers";

type CreateServiceStepChannelGroupProps = {
  form: FormState;
  displayId: string;
  channels: Channel[];
  groupsForChannel: { service_group_id: string; service_group_name: string }[];
  canAdvanceStep1: boolean;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onNext: () => void;
};

export const CreateServiceStepChannelGroup: FC<CreateServiceStepChannelGroupProps> = ({
  form,
  displayId,
  channels,
  groupsForChannel,
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Service channel <span className="text-red-500">*</span>
        </label>
        <select
          value={form.service_group_channel}
          onChange={(e) => {
            const ch = e.target.value as Channel | "";
            setForm((f) => ({
              ...f,
              service_group_channel: ch,
              service_group_id: "",
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
          Service group <span className="text-red-500">*</span>
        </label>
        <select
          value={form.service_group_id}
          onChange={(e) => setForm((f) => ({ ...f, service_group_id: e.target.value }))}
          disabled={!form.service_group_channel}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-60"
        >
          <option value="">Select service group…</option>
          {groupsForChannel.map((g) => (
            <option key={g.service_group_id} value={g.service_group_id}>
              {g.service_group_name}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={onNext}
        disabled={!canAdvanceStep1}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next: Custom
      </button>
    </div>
  </div>
);
