"use client";

import React, { FC } from "react";
import type { EditFormState, ServiceDetailModel, ServiceType } from "./service_detail_types";
import { SERVICE_TYPES } from "./service_detail_constants";
import { ServiceDetailRelatedSection } from "./ServiceDetailRelatedSection";

type ServiceDetailMainPanelProps = {
  service: ServiceDetailModel;
  form: EditFormState;
  saving: boolean;
  error: string | null;
  canSave: boolean;
  setForm: React.Dispatch<React.SetStateAction<EditFormState>>;
  onReset: () => void;
  onSave: () => void | Promise<void>;
};

export const ServiceDetailMainPanel: FC<ServiceDetailMainPanelProps> = ({
  service,
  form,
  saving,
  error,
  canSave,
  setForm,
  onReset,
  onSave,
}) => (
  <div className="flex flex-col w-full">
    <div className="bg-white rounded-b-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">Service details</p>
            <p className="text-xs text-gray-500 mt-1">ID: {service.id_service}</p>
            <p className="text-xs text-gray-500 mt-1">
              {service.specifity === "general" ? "General service" : "Specific-related service"}
              {service.parent_service?.name ? ` · based on ${service.parent_service.name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => void onSave()}
              disabled={!canSave || saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-6 max-w-xl">
          <div className="space-y-5">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. portal_article"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Service type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.service_type}
                onChange={(e) => setForm((f) => ({ ...f, service_type: e.target.value as ServiceType | "" }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select type</option>
                {SERVICE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Service description</label>
              <textarea
                value={form.service_description}
                onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the service"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Service specifications</label>
              <textarea
                value={form.service_unit_specifications}
                onChange={(e) => setForm((f) => ({ ...f, service_unit_specifications: e.target.value }))}
                rows={5}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Technical specifications"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Service price (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.service_price || ""}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setForm((f) => ({ ...f, service_price: Number.isNaN(v) ? 0 : v }));
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <ServiceDetailRelatedSection service={service} />
        </div>
      </div>
    </div>
  </div>
);
