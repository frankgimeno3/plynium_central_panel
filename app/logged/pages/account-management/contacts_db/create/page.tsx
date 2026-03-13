"use client";

import React, { FC, useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import CustomerSelectModal, { type CustomerRow } from "@/app/logged/logged_components/modals/CustomerSelectModal";
import contactsData from "@/app/contents/contactsContents.json";

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

type Step = 1 | 2 | 3 | 4;

type ContactRow = {
  id_contact: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  id_customer?: string;
  company_name?: string;
  id_user?: string;
  linkedin_profile?: string;
  based_in_country?: string;
  comments?: unknown[];
  userListArray?: string[];
};

const allContacts = (contactsData as ContactRow[]).filter(
  (c) => c && typeof c.id_contact === "string"
);

function generateNextContactId(): string {
  const prefix = "cont-";
  const numericIds = allContacts
    .map((c) => {
      const match = c.id_contact.replace(prefix, "").match(/^(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const max = numericIds.length > 0 ? Math.max(...numericIds) : 0;
  const next = (max + 1).toString().padStart(3, "0");
  return `${prefix}${next}`;
}

type FormState = {
  linkedToCustomer: boolean;
  linkedCustomer: CustomerRow | null;
  id_contact: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  id_customer: string;
  company_name: string;
  linkedin_profile: string;
  based_in_country: string;
  id_user: string;
};

const initialForm: FormState = {
  linkedToCustomer: false,
  linkedCustomer: null,
  id_contact: "",
  name: "",
  role: "",
  email: "",
  phone: "",
  id_customer: "",
  company_name: "",
  linkedin_profile: "",
  based_in_country: "",
  id_user: "",
};

const CreateContactPage: FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [linkCustomerModalOpen, setLinkCustomerModalOpen] = useState(false);
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

  const canAdvanceStep1 = !form.linkedToCustomer || !!form.linkedCustomer?.id_customer;

  useEffect(() => {
    if (step === 2 && !form.id_contact) {
      setForm((f) => ({ ...f, id_contact: generateNextContactId() }));
    }
  }, [step, form.id_contact]);

  const canAdvanceStep2 =
    !!form.id_contact &&
    form.name.trim().length > 0 &&
    form.email.trim().length > 0;

  const goNext = () => {
    if (step === 1 && canAdvanceStep1) {
      setErrors({});
      setStep(2);
    } else if (step === 2 && canAdvanceStep2) {
      setErrors({});
      setStep(3);
    } else if (step === 3) setStep(4);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/logged/pages/account-management/contacts_db");
    router.refresh();
  };

  const breadcrumbs = [
    { label: "Account management", href: "/logged/pages/account-management/customers_db" },
    { label: "Contacts DB", href: "/logged/pages/account-management/contacts_db" },
    { label: "New contact" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "New contact",
      breadcrumbs,
      buttons: [{ label: "Back", href: "/logged/pages/account-management/contacts_db" }],
    });
  }, [setPageMeta, breadcrumbs]);

  const stepLabels: Record<Step, string> = {
    1: "Link to account",
    2: "Required data",
    3: "Optional data",
    4: "Preview",
  };

  return (
    <>
      <PageContentSection className="p-0">
        <div className="flex flex-col w-full mt-12">
          <div className="flex border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center gap-4">
              {([1, 2, 3, 4] as Step[]).map((s) => (
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
                  {s < 4 && <span className="w-6 h-0.5 bg-gray-300" />}
                </React.Fragment>
              ))}
              <span className="text-sm text-gray-600 ml-2">{stepLabels[step]}</span>
            </div>
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden p-8 md:p-12 w-full max-w-full">
            {/* Step 1: Link to customer (optional) */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Is this contact linked to an existing customer/account?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.linkedToCustomer}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          linkedToCustomer: !f.linkedToCustomer,
                          ...(!f.linkedToCustomer ? {} : { linkedCustomer: null, id_customer: "", company_name: "" }),
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        form.linkedToCustomer ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                          form.linkedToCustomer ? "translate-x-5" : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-700">
                      {form.linkedToCustomer ? "Yes" : "No"}
                    </span>
                  </div>
                  {form.linkedToCustomer && (
                    <div className="mt-4">
                      <label className="block text-xs text-gray-600 mb-1">
                        Link to an account <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setLinkCustomerModalOpen(true)}
                        className={`w-full px-4 py-2 border-2 rounded-lg text-sm font-medium transition-colors ${
                          form.linkedCustomer
                            ? "border-blue-800 bg-blue-800 text-white hover:bg-blue-900"
                            : "border-dashed border-gray-300 text-gray-700 hover:border-blue-950 hover:bg-blue-50/30"
                        }`}
                      >
                        {form.linkedCustomer
                          ? `${form.linkedCustomer.name || form.linkedCustomer.id_customer} (${form.linkedCustomer.id_customer})`
                          : "Select customer/account"}
                      </button>
                    </div>
                  )}
                </div>
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

            {/* Step 2: Required – id_contact (read-only), name, role, email, phone; company if linked */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Required data</p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Contact ID (read-only)</label>
                    <p className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm font-mono text-gray-800">
                      {form.id_contact || "—"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Full name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Role</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Commercial Director"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email@company.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+34 912 345 678"
                    />
                  </div>
                  {form.linkedCustomer && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Company (from linked account)</label>
                      <p className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-800">
                        {form.company_name || form.linkedCustomer.name || form.id_customer}
                      </p>
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
                    Next: Optional data
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Optional – LinkedIn, based_in_country, id_user (Plynium user) */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Optional data</p>
                  <p className="text-xs text-gray-500 mb-3">
                    You can fill these in or go directly to the next step.
                  </p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">LinkedIn profile URL</label>
                    <input
                      type="url"
                      value={form.linkedin_profile}
                      onChange={(e) => setForm((f) => ({ ...f, linkedin_profile: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://www.linkedin.com/in/..."
                    />
                  </div>
                  <div ref={countryComboboxRef} className="relative">
                    <label className="block text-xs text-gray-600 mb-1">Based in country</label>
                    <input
                      type="text"
                      value={countryDropdownOpen ? countryFilter : form.based_in_country}
                      onChange={(e) => {
                        setCountryFilter(e.target.value);
                        setCountryDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setCountryFilter(form.based_in_country);
                        setCountryDropdownOpen(true);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                              aria-selected={form.based_in_country === country}
                              onClick={() => {
                                setForm((f) => ({ ...f, based_in_country: country }));
                                setCountryFilter(country);
                                setCountryDropdownOpen(false);
                              }}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                                form.based_in_country === country ? "bg-blue-100 font-medium" : ""
                              }`}
                            >
                              {country}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Plynium user ID (vinculation)</label>
                    <input
                      type="text"
                      value={form.id_user}
                      onChange={(e) => setForm((f) => ({ ...f, id_user: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. user_001"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Link this contact to a Plynium network user profile (optional).
                    </p>
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

            {/* Step 4: Preview and finish */}
            {step === 4 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <p className="text-sm font-semibold text-gray-700 mb-4">Preview</p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-gray-500">Contact ID</dt>
                      <dd className="font-mono font-medium text-gray-900">{form.id_contact}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium text-gray-900">{form.name || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Role</dt>
                      <dd className="font-medium text-gray-900">{form.role || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-medium text-gray-900">{form.email || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Phone</dt>
                      <dd className="font-medium text-gray-900">{form.phone || "—"}</dd>
                    </div>
                    {(form.id_customer || form.company_name) && (
                      <>
                        <div>
                          <dt className="text-gray-500">Linked account (ID)</dt>
                          <dd className="font-medium text-gray-900">{form.id_customer || "—"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Company</dt>
                          <dd className="font-medium text-gray-900">{form.company_name || "—"}</dd>
                        </div>
                      </>
                    )}
                    {(form.linkedin_profile || form.based_in_country || form.id_user) && (
                      <>
                        {form.linkedin_profile && (
                          <div>
                            <dt className="text-gray-500">LinkedIn profile</dt>
                            <dd className="font-medium text-gray-900 break-all">{form.linkedin_profile}</dd>
                          </div>
                        )}
                        {form.based_in_country && (
                          <div>
                            <dt className="text-gray-500">Based in country</dt>
                            <dd className="font-medium text-gray-900">{form.based_in_country}</dd>
                          </div>
                        )}
                        {form.id_user && (
                          <div>
                            <dt className="text-gray-500">Plynium user ID</dt>
                            <dd className="font-medium text-gray-900">{form.id_user}</dd>
                          </div>
                        )}
                      </>
                    )}
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
                    Create contact
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </PageContentSection>

      <CustomerSelectModal
        open={linkCustomerModalOpen}
        onClose={() => setLinkCustomerModalOpen(false)}
        onSelectCustomer={(customer) => {
          setForm((f) => ({
            ...f,
            linkedCustomer: customer,
            id_customer: customer.id_customer,
            company_name: customer.name || "",
          }));
          setLinkCustomerModalOpen(false);
        }}
        pageSize={20}
        confirmLabel="Continue"
      />
    </>
  );
};

export default CreateContactPage;
