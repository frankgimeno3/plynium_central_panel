"use client";

import React, { FC } from "react";
import type { CampaignRow, FormState, PortalRow } from "./create_service_types";

type CreateServiceDemFieldsProps = {
  custom: Extract<FormState["custom"], { channel: "dem" }>;
  portals: PortalRow[];
  campaignsForPortal: CampaignRow[];
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setCampaignsForPortal: React.Dispatch<React.SetStateAction<CampaignRow[]>>;
};

export const CreateServiceDemFields: FC<CreateServiceDemFieldsProps> = ({
  custom,
  portals,
  campaignsForPortal,
  setForm,
  setCampaignsForPortal,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Publication month <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={1}
          max={12}
          value={custom.publicationMonth}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              custom: f.custom && f.custom.channel === "dem" ? { ...f.custom, publicationMonth: e.target.value } : f.custom,
            }))
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="1-12"
        />
      </div>
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Year <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={2000}
          max={2100}
          value={custom.publicationYear}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              custom: f.custom && f.custom.channel === "dem" ? { ...f.custom, publicationYear: e.target.value } : f.custom,
            }))
          }
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
          placeholder="YYYY"
        />
      </div>
    </div>

    <div>
      <label className="block text-xs text-gray-600 mb-1">
        Portal <span className="text-red-500">*</span>
      </label>
      <select
        value={custom.portalId}
        onChange={(e) => {
          const pid = e.target.value;
          setForm((f) => ({
            ...f,
            custom:
              f.custom && f.custom.channel === "dem"
                ? { ...f.custom, portalId: pid, campaignId: "", campaignName: "" }
                : f.custom,
          }));
          setCampaignsForPortal([]);
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

    {custom.portalId && (
      <div>
        <label className="block text-xs text-gray-600 mb-1">
          Newsletter campaign <span className="text-red-500">*</span>
        </label>
        <select
          value={custom.campaignId}
          onChange={(e) => {
            const cid = e.target.value;
            const c = campaignsForPortal.find((x) => x.id === cid);
            setForm((f) => ({
              ...f,
              custom:
                f.custom && f.custom.channel === "dem" ? { ...f.custom, campaignId: cid, campaignName: c?.name ?? "" } : f.custom,
            }));
          }}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
        >
          <option value="">Select campaign…</option>
          {campaignsForPortal.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);
