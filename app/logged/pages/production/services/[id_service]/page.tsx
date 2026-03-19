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
  publication_date?: string;
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
  has_publication_date: boolean;
  publication_date: string;
};

const initialEditForm: EditFormState = {
  name: "",
  service_type: "",
  service_description: "",
  service_price: 0,
  has_publication_date: false,
  publication_date: "",
};

function formatPublicationDate(isoDate: string | undefined): string {
  if (!isoDate) return "—";
  const d = new Date(isoDate + "T12:00:00");
  if (Number.isNaN(d.getTime())) return isoDate;
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString().slice(-2);
  return `${day}/${month}/${year}`;
}

const ServiceDetailPage: FC<{ params: Promise<{ id_service: string }> }> = ({ params }) => {
  const { id_service } = use(params);
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
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
      has_publication_date: !!service.publication_date,
      publication_date: service.publication_date ?? "",
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

  const price = service.tariff_price_eur ?? service.service_price ?? null;
  const serviceTypeLabel =
    service.service_type != null
      ? SERVICE_TYPES.find((t) => t.value === service.service_type)?.label ?? service.service_type
      : "—";

  const canSave =
    form.name.trim().length > 0 &&
    form.service_type !== "" &&
    form.service_description.trim().length > 0 &&
    form.service_price >= 0 &&
    (!form.has_publication_date || (form.has_publication_date && form.publication_date.length > 0));

  const handleCancel = () => {
    setError(null);
    setIsEditing(false);
    setForm({
      name: service.name ?? "",
      service_type: normalizeServiceType(service.service_type),
      service_description: service.service_description ?? "",
      service_price: service.tariff_price_eur ?? service.service_price ?? 0,
      has_publication_date: !!service.publication_date,
      publication_date: service.publication_date ?? "",
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
        publication_date: form.has_publication_date ? form.publication_date : null,
      });
      setService(updated);
      setIsEditing(false);
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
                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
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
                )}
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!isEditing ? (
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Name</dt>
                    <dd className="font-medium text-gray-900">{service.name?.replace(/_/g, " ") ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Service type</dt>
                    <dd className="font-medium text-gray-900">{serviceTypeLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Description</dt>
                    <dd className="font-medium text-gray-900 whitespace-pre-wrap">
                      {service.service_description?.trim() ? service.service_description : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Price (€)</dt>
                    <dd className="font-medium text-gray-900">
                      {price != null ? Number(price).toLocaleString() : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Publication date</dt>
                    <dd className="font-medium text-gray-900">{formatPublicationDate(service.publication_date)}</dd>
                  </div>
                </dl>
              ) : (
                <div className="space-y-6 max-w-xl">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Edit service</p>

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
                        <label className="block text-xs text-gray-600 mb-1">
                          Service description <span className="text-red-500">*</span>
                        </label>
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

                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Is there an established publication date?</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={form.has_publication_date}
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                has_publication_date: !f.has_publication_date,
                                ...(f.has_publication_date ? { publication_date: "" } : {}),
                              }));
                            }}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              form.has_publication_date ? "bg-blue-600" : "bg-gray-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                                form.has_publication_date ? "translate-x-5" : "translate-x-1"
                              }`}
                            />
                          </button>
                          <span className="text-sm text-gray-700">{form.has_publication_date ? "Yes" : "No"}</span>
                        </div>

                        {form.has_publication_date && (
                          <div className="mt-4">
                            <label className="block text-xs text-gray-600 mb-1">Publication date (dd/mm/yy)</label>
                            <input
                              type="date"
                              value={form.publication_date}
                              onChange={(e) => setForm((f) => ({ ...f, publication_date: e.target.value }))}
                              className="w-full max-w-xs px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ServiceDetailPage;
