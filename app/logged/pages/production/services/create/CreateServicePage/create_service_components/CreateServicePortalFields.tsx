"use client";

import React, { FC } from "react";
import type { FormState, PortalRow } from "./create_service_types";

type CreateServicePortalFieldsProps = {
  custom: Extract<FormState["custom"], { channel: "portal" }>;
  portals: PortalRow[];
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
};

export const CreateServicePortalFields: FC<CreateServicePortalFieldsProps> = ({
  custom,
  portals,
  setForm,
}) => (
  <div>
    <label className="block text-xs text-gray-600 mb-1">
      Portal <span className="text-red-500">*</span>
    </label>
    <select
      value={custom.portalId}
      onChange={(e) => {
        const pid = e.target.value;
        const p = portals.find((x) => String(x.id) === String(pid));
        setForm((f) => ({
          ...f,
          custom: f.custom && f.custom.channel === "portal" ? { ...f.custom, portalId: pid, portalName: p?.name ?? "" } : f.custom,
        }));
      }}
      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
    >
      <option value="">Select portal…</option>
      {portals.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  </div>
);
