"use client";

import React, { FC, use, useEffect, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ServiceService } from "@/app/service/ServiceService";

type ServiceType = "newsletter" | "portal" | "magazine" | "other";

type Service = {
  id_service: string;
  name: string;
  tariff_price_eur?: number;
  service_price?: number;
  service_type?: ServiceType;
  service_description?: string;
};

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "portal", label: "Portal" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

type EditFormState = {
  name: string;
  service_type: ServiceType | "";
  service_description: string;
  service_price: number;
};

const initialEditForm: EditFormState = {
  name: "",
  service_type: "",
  service_description: "",
  service_price: 0,
};

const ServiceDetailPage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const { id_service } = use(params);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditFormState>(initialEditForm);

  const normalizeServiceType = (value?: string): ServiceType | "" => {
    if (!value) return "";
    return SERVICE_TYPES.some((t) => t.value === value) ? (value as ServiceType) : "";
  };

  useEffect(() => {
    ServiceService.getServiceById(id_service)
      .then((s) => setService(s ?? null))
      .catch(() => setService(null))
      .finally(() => setLoading(false));
  }, [id_service]);

  useEffect(() => {
    if (!service) return;
    setForm({
      name: service.name ?? "",
      service_type: normalizeServiceType(service.service_type),
      service_description: service.service_description ?? "",
      service_price: service.tariff_price_eur ?? service.service_price ?? 0,
    });
  }, [service]);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (service) {
      setPageMeta({
        pageTitle: `Service: ${service.name?.replace(/_/g, " ") ?? id_service}`,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Services", href: "/logged/pages/production/services" },
          { label: service.name?.replace(/_/g, " ") ?? id_service },
        ],
        buttons: [
          { label: "Back to Services", href: "/logged/pages/production/services" },
          { label: "Create Service", href: "/logged/pages/production/services/create" },
        ],
      });
    } else {
      setPageMeta({
        pageTitle: "Service not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Services", href: "/logged/pages/production/services" },
        ],
        buttons: [{ label: "Back to Services", href: "/logged/pages/production/services" }],
      });
    }
  }, [setPageMeta, service, id_service]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Loading…</div>
          </div>
        </div>
      </PageContentSection>
    );
  }
  if (!service) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Service not found.</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const canSave =
    form.name.trim().length > 0 && form.service_type !== "" && form.service_price >= 0;

  const handleReset = () => {
    setError(null);
    setForm({
      name: service.name ?? "",
      service_type: normalizeServiceType(service.service_type),
      service_description: service.service_description ?? "",
      service_price: service.tariff_price_eur ?? service.service_price ?? 0,
    });
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await ServiceService.updateService(id_service, {
        name: form.name.trim(),
        service_type: form.service_type,
        service_description: form.service_description.trim(),
        tariff_price_eur: form.service_price,
      });
      setService(updated);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update service");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Service details</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {service.id_service}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={saving}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
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
              </div>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ServiceDetailPage;
