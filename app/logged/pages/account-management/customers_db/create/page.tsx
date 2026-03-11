"use client";

import React, { FC, useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import CustomerSelectModal, { type CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";
import customersData from "@/app/contents/customers.json";
import agentsData from "@/app/contents/agentsContents.json";

const COUNTRY_OPTIONS = [
  "Spain",
  "France",
  "Germany",
  "Italy",
  "Portugal",
  "United Kingdom",
  "Netherlands",
  "Belgium",
  "Poland",
  "Austria",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Greece",
  "Czech Republic",
  "Romania",
  "Hungary",
  "Turkey",
  "Russia",
  "Ukraine",
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "Argentina",
  "Chile",
  "Colombia",
  "China",
  "India",
  "Japan",
  "South Korea",
  "Australia",
  "South Africa",
  "Morocco",
  "Egypt",
  "Other",
];

type Step = 1 | 2 | 3 | 4 | 5;

const ACCOUNT_TYPES = [
  { value: "manufacturer_distributor", label: "Manufacturer and/or distributor company account" },
  { value: "distributor_only", label: "Non-manufacturer distributor company account" },
  { value: "agency", label: "Agency account" },
  { value: "institution", label: "Institution account" },
  { value: "parent_company", label: "Parent company account" },
  { value: "event", label: "Event account" },
] as const;

type AccountTypeValue = (typeof ACCOUNT_TYPES)[number]["value"];

const TYPES_REQUIRING_RELATED =
  new Set<AccountTypeValue>(["agency", "institution", "parent_company", "event"]);

const allCustomers = (customersData as CustomerRow[]).filter(
  (c) => c && typeof c.id_customer === "string"
);

type Agent = { id_agent: string; name: string; email?: string; phone?: string };
const agents = (agentsData as Agent[]).filter((a) => a && typeof a.id_agent === "string");

function generateNextCustomerId(): string {
  const prefix = "cust-";
  const numericIds = allCustomers
    .map((c) => {
      const match = c.id_customer.replace(prefix, "").match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}${next}`;
}

type FormState = {
  accountType: AccountTypeValue | "";
  relatedToExisting: boolean;
  linkedAccount: CustomerRow | null;
  id_customer: string;
  name: string;
  country: string;
  agent: string;
  website: string;
  cif: string;
  address: string;
  postal_code: string;
  sector: string;
  origin: string;
  email: string;
  phone: string;
};

const initialForm: FormState = {
  accountType: "",
  relatedToExisting: false,
  linkedAccount: null,
  id_customer: "",
  name: "",
  country: "",
  agent: "",
  website: "",
  cif: "",
  address: "",
  postal_code: "",
  sector: "",
  origin: "",
  email: "",
  phone: "",
};

const CreateCustomerPage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [linkAccountModalOpen, setLinkAccountModalOpen] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryFilter, setCountryFilter] = useState("");
  const countryComboboxRef = useRef<HTMLDivElement>(null);

  const countryOptionsFiltered = useMemo(() => {
    const q = countryFilter.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((c) => c.toLowerCase().includes(q));
  }, [countryFilter]);

  useEffect(() => {
    if (!countryDropdownOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (countryComboboxRef.current && !countryComboboxRef.current.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [countryDropdownOpen]);

  const showRelatedBlock = form.accountType && TYPES_REQUIRING_RELATED.has(form.accountType as AccountTypeValue);
  const mustLinkAccount = showRelatedBlock && form.relatedToExisting;
  const canAdvanceStep1 =
    !!form.accountType &&
    (!showRelatedBlock || !form.relatedToExisting || !!form.linkedAccount?.id_customer);

  useEffect(() => {
    if (step === 2 && !form.id_customer) {
      setForm((f) => ({ ...f, id_customer: generateNextCustomerId() }));
    }
  }, [step, form.id_customer]);

  const canAdvanceStep2 = useMemo(() => {
    return (
      !!form.id_customer &&
      form.name.trim().length > 0 &&
      form.country.trim().length > 0 &&
      form.agent.trim().length > 0 &&
      form.website.trim().length > 0
    );
  }, [form.id_customer, form.name, form.country, form.agent, form.website]);

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setErrors({});
      setStep(2);
    } else if (step === 2 && canAdvanceStep2) {
      setErrors({});
      setStep(3);
    } else if (step === 3) setStep(4);
    else if (step === 4) setStep(5);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Persist would go here (e.g. append to customers.json via API). For now navigate back.
    router.push("/logged/pages/account-management/customers_db");
    router.refresh();
  };

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Customers DB", href: "/logged/pages/account-management/customers_db" },
    { label: "New account" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "New account (Customer)",
      breadcrumbs,
      buttons: [{ label: "Back", href: "/logged/pages/account-management/customers_db" }],
    });
  }, [setPageMeta, breadcrumbs]);

  const stepLabels: Record<Step, string> = {
    1: "Account type",
    2: "Required data",
    3: "Optional data",
    4: "Contact info",
    5: "Preview",
  };

  return (
    <>
      <PageContentSection className="p-0">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            {([1, 2, 3, 4, 5] as Step[]).map((s) => (
              <React.Fragment key={s}>
                <button
                  type="button"
                  onClick={() => s < step && setStep(s)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                    step === s
                      ? "bg-blue-600 text-white"
                      : step > s
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-200 text-gray-500"
                  } ${step > s ? "cursor-pointer" : ""}`}
                >
                  {s}
                </button>
                {s < 5 && <span className="w-6 h-0.5 bg-gray-300" />}
              </React.Fragment>
            ))}
            <span className="text-sm text-gray-600 ml-2">{stepLabels[step]}</span>
          </div>
        </div>

        <div className="p-8 md:p-12 w-full max-w-full">
          {/* Step 1: Account type + related to existing */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  What type of account do you want to create?
                </p>
                <div className="space-y-2">
                  {ACCOUNT_TYPES.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/30"
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={opt.value}
                        checked={form.accountType === opt.value}
                        onChange={() =>
                          setForm((f) => ({
                            ...f,
                            accountType: opt.value,
                            relatedToExisting: false,
                            linkedAccount: null,
                          }))
                        }
                        className="text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-900">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {showRelatedBlock && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Is this account related to an existing one?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.relatedToExisting}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          relatedToExisting: !f.relatedToExisting,
                          ...(!f.relatedToExisting ? {} : { linkedAccount: null }),
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        form.relatedToExisting ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                          form.relatedToExisting ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-700">
                      {form.relatedToExisting ? "Yes" : "No"}
                    </span>
                  </div>
                  {form.relatedToExisting && (
                    <div className="mt-4">
                      <label className="block text-xs text-gray-600 mb-1">
                        Link to an account <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setLinkAccountModalOpen(true)}
                        className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                          form.linkedAccount
                            ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900"
                            : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
                        }`}
                      >
                        {form.linkedAccount
                          ? `${form.linkedAccount.name || form.linkedAccount.id_customer} (${form.linkedAccount.id_customer})`
                          : "Link to an account"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!canAdvanceStep1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Required data
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Required – id (read-only), name, country, agent, website */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Required data</p>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Client ID (read-only)</label>
                  <p className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-mono text-gray-800">
                    {form.id_customer || "—"}
                  </p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Account name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company or account name"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>
                <div ref={countryComboboxRef} className="relative">
                  <label className="block text-xs text-gray-600 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={countryDropdownOpen ? countryFilter : form.country}
                    onChange={(e) => {
                      setCountryFilter(e.target.value);
                      setCountryDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setCountryFilter(form.country);
                      setCountryDropdownOpen(true);
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Type to search and select a country"
                    autoComplete="off"
                  />
                  {countryDropdownOpen && (
                    <ul
                      className="absolute z-10 mt-1 w-full max-h-56 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                      role="listbox"
                    >
                      {countryOptionsFiltered.length === 0 ? (
                        <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
                      ) : (
                        countryOptionsFiltered.map((country) => (
                          <li
                            key={country}
                            role="option"
                            aria-selected={form.country === country}
                            onClick={() => {
                              setForm((f) => ({ ...f, country }));
                              setCountryFilter(country);
                              setCountryDropdownOpen(false);
                              if (errors.country) setErrors((e) => ({ ...e, country: undefined }));
                            }}
                            className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                              form.country === country ? "bg-blue-100 font-medium" : ""
                            }`}
                          >
                            {country}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                  {errors.country && <p className="mt-1 text-xs text-red-500">{errors.country}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Agent <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.agent}
                    onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select agent</option>
                    {agents.map((a) => (
                      <option key={a.id_agent} value={a.name}>
                        {a.name} ({a.id_agent})
                      </option>
                    ))}
                  </select>
                  {errors.agent && <p className="mt-1 text-xs text-red-500">{errors.agent}</p>}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Website <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                  {errors.website && <p className="mt-1 text-xs text-red-500">{errors.website}</p>}
                </div>
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
                  Next: Optional data
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Optional – CIF, fiscal address, postal code, sector, origin */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Optional data</p>
                <p className="text-xs text-gray-500 mb-3">
                  You can fill these in or go directly to the next step.
                </p>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">CIF</label>
                  <input
                    type="text"
                    value={form.cif}
                    onChange={(e) => setForm((f) => ({ ...f, cif: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="B12345678"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Fiscal address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Billing address"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Postal code</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="28001"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Sector</label>
                  <input
                    type="text"
                    value={form.sector}
                    onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Glass and glazing"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Origin</label>
                  <input
                    type="text"
                    value={form.origin}
                    onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Web, Trade fair, Referral..."
                  />
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Next: Contact info
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Contact – generic company email and phone */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Contact information</p>
                <p className="text-xs text-gray-500 mb-3">General company contact.</p>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Company generic email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="info@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Company generic phone</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+34 912 345 670"
                  />
                </div>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Next: Preview
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Preview and finish */}
          {step === 5 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <p className="text-sm font-semibold text-gray-700 mb-4">Preview</p>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500">Account type</dt>
                    <dd className="font-medium text-gray-900">
                      {ACCOUNT_TYPES.find((t) => t.value === form.accountType)?.label ?? "—"}
                    </dd>
                  </div>
                  {form.linkedAccount && (
                    <div>
                      <dt className="text-gray-500">Linked to account</dt>
                      <dd className="font-medium text-gray-900">
                        {form.linkedAccount.name} ({form.linkedAccount.id_customer})
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-gray-500">Client ID</dt>
                    <dd className="font-mono font-medium text-gray-900">{form.id_customer}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Account name</dt>
                    <dd className="font-medium text-gray-900">{form.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Country</dt>
                    <dd className="font-medium text-gray-900">{form.country || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Agent</dt>
                    <dd className="font-medium text-gray-900">{form.agent || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Website</dt>
                    <dd className="font-medium text-gray-900 break-all">{form.website || "—"}</dd>
                  </div>
                  {(form.cif || form.address || form.postal_code || form.sector || form.origin) && (
                    <>
                      <div>
                        <dt className="text-gray-500">CIF</dt>
                        <dd className="font-medium text-gray-900">{form.cif || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Fiscal address</dt>
                        <dd className="font-medium text-gray-900">{form.address || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Postal code</dt>
                        <dd className="font-medium text-gray-900">{form.postal_code || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Sector</dt>
                        <dd className="font-medium text-gray-900">{form.sector || "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">Origin</dt>
                        <dd className="font-medium text-gray-900">{form.origin || "—"}</dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt className="text-gray-500">Company generic email</dt>
                    <dd className="font-medium text-gray-900">{form.email || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Company generic phone</dt>
                    <dd className="font-medium text-gray-900">{form.phone || "—"}</dd>
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
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Create account
                </button>
              </div>
            </form>
          )}
        </div>
      </PageContentSection>

      <CustomerSelectModal
        open={linkAccountModalOpen}
        onClose={() => setLinkAccountModalOpen(false)}
        onSelectCustomer={(customer) => {
          setForm((f) => ({ ...f, linkedAccount: customer }));
          setLinkAccountModalOpen(false);
        }}
        pageSize={20}
        confirmLabel="Continue"
      />
    </>
  );
};

export default CreateCustomerPage;
