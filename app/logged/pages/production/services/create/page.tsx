"use client";

import React, { FC, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import servicesData from "@/app/contents/services.json";

type ServiceType = "newsletter" | "portal" | "magazine" | "other";

type Step = 1 | 2 | 3;

type FormState = {
  id_service: string;
  name: string;
  service_type: ServiceType | "";
  service_description: string;
  service_price: number;
  has_publication_date: boolean;
  publication_date: string;
};

const SERVICE_TYPES: { value: ServiceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "portal", label: "Portal" },
  { value: "magazine", label: "Magazine" },
  { value: "other", label: "Other" },
];

const allServices = servicesData as { id_service: string }[];

function generateNextServiceId(): string {
  const prefix = "srv-";
  const numericIds = allServices
    .map((s) => {
      const match = (s.id_service || "").replace(prefix, "").match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}${next}`;
}

const initialForm: FormState = {
  id_service: "",
  name: "",
  service_type: "",
  service_description: "",
  service_price: 0,
  has_publication_date: false,
  publication_date: "",
};

const CreateServicePage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);

  const nextId = useMemo(() => generateNextServiceId(), []);

  const canAdvanceStep1 = form.name.trim().length > 0 && form.service_type !== "";
  const canAdvanceStep2 =
    form.service_description.trim().length > 0 &&
    form.service_price >= 0 &&
    (!form.has_publication_date || (form.has_publication_date && form.publication_date.length > 0));

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setForm((f) => ({ ...f, id_service: nextId }));
      setStep(2);
    } else if (step === 2 && canAdvanceStep2) setStep(3);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const backUrl = "/logged/pages/production/services";

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Services", href: backUrl },
    { label: "Create service" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create service",
      breadcrumbs,
      buttons: [{ label: "Back", href: backUrl }],
    });
  }, [setPageMeta, breadcrumbs, backUrl]);

  const displayId = step >= 2 ? (form.id_service || nextId) : nextId;

  return (
    <>
      <PageContentSection className="p-0">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            {([1, 2, 3] as Step[]).map((s) => (
              <React.Fragment key={s}>
                <button
                  type="button"
                  onClick={() => s < step && setStep(s)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                    step === s ? "bg-blue-600 text-white" : step > s ? "bg-green-100 text-green-800" : "bg-gray-200 text-gray-500"
                  } ${step > s ? "cursor-pointer" : ""}`}
                >
                  {s}
                </button>
                {s < 3 && <span className="w-8 h-0.5 bg-gray-300" />}
              </React.Fragment>
            ))}
            <span className="text-sm text-gray-600 ml-2">
              {step === 1 && "ID, name and type"}
              {step === 2 && "Specifications"}
              {step === 3 && "Review"}
            </span>
          </div>
        </div>

        <div className="p-12 w-full">
          {/* Step 1: Service ID (preview), name, service type */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-1">Service ID</p>
                <p className="text-base font-mono font-medium text-gray-900">{displayId}</p>
                <p className="text-xs text-gray-500 mt-1">This will be the ID assigned to the new service.</p>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Newsletter Q1"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Service type <span className="text-red-500">*</span></label>
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvanceStep1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Specifications
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Description, price, publication date toggle + date */}
          {step === 2 && (
            <div className="space-y-6 max-w-xl">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Service description <span className="text-red-500">*</span></label>
                <textarea
                  value={form.service_description}
                  onChange={(e) => setForm((f) => ({ ...f, service_description: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the service"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1">Service price (€) <span className="text-red-500">*</span></label>
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
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        has_publication_date: !f.has_publication_date,
                        ...(!f.has_publication_date ? {} : { publication_date: "" }),
                      }))
                    }
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

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvanceStep2}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Review
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Service review</p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Service ID</dt>
                    <dd className="font-medium font-mono">{form.id_service || nextId}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium">{form.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Service type</dt>
                    <dd className="font-medium">
                      {SERVICE_TYPES.find((t) => t.value === form.service_type)?.label ?? (form.service_type || "—")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Description</dt>
                    <dd className="font-medium whitespace-pre-wrap">{form.service_description || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Price (€)</dt>
                    <dd className="font-medium">{form.service_price != null ? form.service_price.toLocaleString() : "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Publication date</dt>
                    <dd className="font-medium">
                      {form.has_publication_date && form.publication_date
                        ? (() => {
                            const d = new Date(form.publication_date + "T12:00:00");
                            if (Number.isNaN(d.getTime())) return form.publication_date;
                            const day = d.getDate().toString().padStart(2, "0");
                            const month = (d.getMonth() + 1).toString().padStart(2, "0");
                            const year = d.getFullYear().toString().slice(-2);
                            return `${day}/${month}/${year}`;
                          })()
                        : "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => router.push(backUrl)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create service
                </button>
              </div>
            </div>
          )}
        </div>
      </PageContentSection>
    </>
  );
};

export default CreateServicePage;
