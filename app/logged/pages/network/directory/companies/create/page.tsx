'use client';

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { CompanyService } from '@/app/service/CompanyService';
import { PortalService } from '@/app/service/PortalService';
import { useCompanyRequests } from '@/app/logged/pages/network/requests/hooks/useCompanyRequests';
import CompanyRequestSelectModal from '@/app/logged/logged_components/modals/CompanyRequestSelectModal';
import MediatecaModal from '@/app/logged/logged_components/modals/MediatecaModal';
import CategoriesModal from '@/app/logged/logged_components/modals/CategoriesModal';
import CustomerSelectModal from '@/app/logged/logged_components/modals/CustomerSelectModal';
import ContactSelectModal from '@/app/logged/logged_components/modals/ContactSelectModal';
import type { CompanyRequest } from '@/app/logged/pages/network/requests/hooks/useCompanyRequests';
import type { CustomerRow } from '@/app/logged/logged_components/modals/CustomerSelectModal';
import type { ContactRow } from '@/app/logged/logged_components/modals/ContactSelectModal';

interface CompanyForm {
  commercialName: string;
  country: string;
  category: string;
  mainDescription: string;
  mainImage: string;
  categoriesArray: string;
  mainEmail: string;
  mailTelephone: string;
  fullAddress: string;
  webLink: string;
}

type FormErrors = Partial<Record<keyof CompanyForm | 'portals' | 'customerAccount' | 'contactAccount', string>>;

const initialForm: CompanyForm = {
  commercialName: '',
  country: '',
  category: '',
  mainDescription: '',
  mainImage: '',
  categoriesArray: '',
  mainEmail: '',
  mailTelephone: '',
  fullAddress: '',
  webLink: '',
};

function generateCompanyId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 9);
  return `comp_${t}_${r}`;
}

const CreateCompanyProfile: FC = () => {
  const router = useRouter();
  const { updateState } = useCompanyRequests();
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const [associatedToRequest, setAssociatedToRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CompanyRequest | null>(null);
  const [requestSelectModalOpen, setRequestSelectModalOpen] = useState(false);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [associatedToCustomer, setAssociatedToCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [createNewCustomer, setCreateNewCustomer] = useState(false);
  const [customerSelectModalOpen, setCustomerSelectModalOpen] = useState(false);
  const [associatedToContact, setAssociatedToContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const [contactSelectModalOpen, setContactSelectModalOpen] = useState(false);
  const [confirmUntagCategory, setConfirmUntagCategory] = useState<string | null>(null);

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list: any[]) => {
        setPortals(
          Array.isArray(list)
            ? list.map((p) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
            : []
        );
      })
      .catch(() => setPortals([]));
  }, []);

  const handleTogglePortal = (portalId: number) => {
    setSelectedPortalIds((prev) =>
      prev.includes(portalId)
        ? prev.filter((id) => id !== portalId)
        : [...prev, portalId]
    );
  };

  const update = (field: keyof CompanyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.commercialName.trim()) next.commercialName = 'Commercial name is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.category.trim()) next.category = 'Category is required';
    if (!form.mainEmail.trim()) next.mainEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mainEmail)) next.mainEmail = 'Invalid email format';
    if (portals.length > 0 && selectedPortalIds.length === 0) next.portals = 'Select at least one portal';
    if (associatedToCustomer && !selectedCustomer && !createNewCustomer) {
      next.customerAccount = 'Select an existing customer account or choose "Create new customer account with this data".';
    }
    if (associatedToContact && !selectedContact) {
      next.contactAccount = 'Select a contact account.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const companyId = generateCompanyId();
      const categoriesArray = form.categoriesArray
        ? form.categoriesArray.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await CompanyService.createCompany({
        companyId,
        commercialName: form.commercialName.trim(),
        country: form.country.trim(),
        category: form.category.trim(),
        mainDescription: form.mainDescription.trim(),
        mainImage: form.mainImage.trim(),
        productsArray: [],
        categoriesArray,
        mainEmail: form.mainEmail.trim(),
        mailTelephone: form.mailTelephone.trim(),
        fullAddress: form.fullAddress.trim(),
        webLink: form.webLink.trim(),
        portalIds: selectedPortalIds.length > 0 ? selectedPortalIds : [],
      });
      if (selectedRequest) {
        updateState(selectedRequest.companyRequestId, 'Done');
      }
      router.push('/logged/pages/network/directory/companies');
      router.refresh();
    } catch (error: unknown) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message
          || (error as { data?: { message?: string } })?.data?.message
          || 'Failed to create company';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const breadcrumbs = [
    { label: "Companies", href: "/logged/pages/network/directory/companies" },
    { label: "Create company" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Create Company",
      breadcrumbs,
      buttons: [{ label: "Back to Companies", href: "/logged/pages/network/directory/companies" }],
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection className="w-full max-w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full max-w-full">
          <div className="flex flex-col gap-4 mb-2">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="block text-sm font-medium text-gray-700">
                Is this associated to a Company Creation Request?
              </span>
              <div className="mt-3 flex items-center justify-left">
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className={`text-sm ${!associatedToRequest ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>No</span>
                  <span className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-within:ring-2 focus-within:ring-blue-950 focus-within:ring-offset-2 ${associatedToRequest ? 'bg-blue-950' : 'bg-gray-200'}`}>
                    <input
                      type="checkbox"
                      checked={associatedToRequest}
                      onChange={(e) => {
                        setAssociatedToRequest(e.target.checked);
                        if (!e.target.checked) setSelectedRequest(null);
                      }}
                      className="sr-only"
                      role="switch"
                      aria-checked={associatedToRequest}
                    />
                    <span className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${associatedToRequest ? 'translate-x-6' : 'translate-x-0'}`} />
                  </span>
                  <span className={`text-sm ${associatedToRequest ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>Yes</span>
                </label>
              </div>
            </div>
            {associatedToRequest && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRequestSelectModalOpen(true)}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
                >
                  {selectedRequest
                    ? `Selected: ${selectedRequest.companyRequestId}`
                    : 'Select request'}
                </button>
                {selectedRequest && (
                  <span className="text-sm text-gray-600">
                    {selectedRequest.content.nombre_comercial} ({selectedRequest.content.pais_empresa})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Commercial Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.commercialName}
                  onChange={(e) => update('commercialName', e.target.value)}
                  placeholder="e.g. GlassTech Solutions"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                    errors.commercialName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.commercialName && (
                  <p className="mt-1 text-sm text-red-500">{errors.commercialName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  placeholder="e.g. United States"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.country && (
                  <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  placeholder="e.g. Manufacturing"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                    errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500">{errors.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Main Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.mainEmail}
                  onChange={(e) => update('mainEmail', e.target.value)}
                  placeholder="e.g. contact@company.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                    errors.mainEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.mainEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.mainEmail}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Telephone
                </label>
                <input
                  type="text"
                  value={form.mailTelephone}
                  onChange={(e) => update('mailTelephone', e.target.value)}
                  placeholder="e.g. +1-555-0101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Web Link
                </label>
                <input
                  type="url"
                  value={form.webLink}
                  onChange={(e) => update('webLink', e.target.value)}
                  placeholder="e.g. https://www.company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Full Address
                </label>
                <input
                  type="text"
                  value={form.fullAddress}
                  onChange={(e) => update('fullAddress', e.target.value)}
                  placeholder="e.g. 123 Industrial Blvd, New York, NY 10001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Main Image
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setMediatecaOpen(true)}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                  >
                    Search or add image
                  </button>
                  {form.mainImage && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <img
                        src={form.mainImage}
                        alt="Main"
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-gray-600 truncate flex-1 min-w-0" title={form.mainImage}>
                        {form.mainImage}
                      </span>
                      <button
                        type="button"
                        onClick={() => update('mainImage', '')}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Portals <span className="text-red-500">*</span>
                </label>
                <p className="text-sm text-gray-600 mb-2">
                  Choose in which portal(s) this company will be visible.
                </p>
                <div className="flex flex-wrap gap-3">
                  {portals.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading portals...</p>
                  ) : (
                    portals.map((p) => (
                      <label
                        key={p.id}
                        className="flex items-center gap-2 cursor-pointer text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPortalIds.includes(p.id)}
                          onChange={() => handleTogglePortal(p.id)}
                          className="rounded border-gray-300"
                        />
                        <span>{p.name}</span>
                      </label>
                    ))
                  )}
                </div>
                {selectedPortalIds.length === 0 && portals.length > 0 && (
                  <p className="text-sm text-amber-600 mt-1">Select at least one portal.</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Categories
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoriesModalOpen(true)}
                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                  >
                    Select categories
                  </button>
                  {form.categoriesArray && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      {form.categoriesArray
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 rounded-lg text-sm font-medium"
                          >
                            {name}
                            <button
                              type="button"
                              onClick={() => setConfirmUntagCategory(name)}
                              className="text-blue-700 hover:text-red-700 font-bold leading-none"
                              aria-label={`Remove ${name}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Main Description
                </label>
                <textarea
                  value={form.mainDescription}
                  onChange={(e) => update('mainDescription', e.target.value)}
                  placeholder="Company description..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>
            </div>
          </div>

          {/* customers_db association */}
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="block text-sm font-medium text-gray-700">
              Is or should this company associated to a customers_db account?
            </span>
            <div className="flex items-center justify-left">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className={`text-sm ${!associatedToCustomer ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>No</span>
                <span className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-within:ring-2 focus-within:ring-blue-950 focus-within:ring-offset-2 ${associatedToCustomer ? 'bg-blue-950' : 'bg-gray-200'}`}>
                  <input
                    type="checkbox"
                    checked={associatedToCustomer}
                    onChange={(e) => {
                      setAssociatedToCustomer(e.target.checked);
                      if (!e.target.checked) {
                        setSelectedCustomer(null);
                        setCreateNewCustomer(false);
                      }
                    }}
                    className="sr-only"
                    role="switch"
                    aria-checked={associatedToCustomer}
                  />
                  <span className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${associatedToCustomer ? 'translate-x-6' : 'translate-x-0'}`} />
                </span>
                <span className={`text-sm ${associatedToCustomer ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>Yes</span>
              </label>
            </div>
            {associatedToCustomer && (
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomerSelectModalOpen(true);
                      setCreateNewCustomer(false);
                    }}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                      selectedCustomer && !createNewCustomer
                        ? 'border-blue-950 bg-blue-950 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-blue-950 hover:bg-blue-50/30'
                    }`}
                  >
                    Select account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCreateNewCustomer(true);
                      setSelectedCustomer(null);
                    }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-bold transition-colors ${
                      createNewCustomer
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    {createNewCustomer && (
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    Create new customer account with this data
                  </button>
                </div>
                {selectedCustomer && (
                  <p className="text-sm text-gray-600">
                    Selected: {selectedCustomer.name} ({selectedCustomer.id_customer})
                  </p>
                )}
                {errors.customerAccount && (
                  <p className="text-sm text-red-500">{errors.customerAccount}</p>
                )}
              </div>
            )}
          </div>

          {/* contacts_db association */}
          <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <span className="block text-sm font-medium text-gray-700">
              Is or should this company associated to a contacts_db account?
            </span>
            <div className="flex items-center justify-left">
              <label className="flex items-center gap-3 cursor-pointer">
                <span className={`text-sm ${!associatedToContact ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>No</span>
                <span className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-within:ring-2 focus-within:ring-blue-950 focus-within:ring-offset-2 ${associatedToContact ? 'bg-blue-950' : 'bg-gray-200'}`}>
                  <input
                    type="checkbox"
                    checked={associatedToContact}
                    onChange={(e) => {
                      setAssociatedToContact(e.target.checked);
                      if (!e.target.checked) setSelectedContact(null);
                    }}
                    className="sr-only"
                    role="switch"
                    aria-checked={associatedToContact}
                  />
                  <span className={`pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${associatedToContact ? 'translate-x-6' : 'translate-x-0'}`} />
                </span>
                <span className={`text-sm ${associatedToContact ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>Yes</span>
              </label>
            </div>
            {associatedToContact && (
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setContactSelectModalOpen(true)}
                  className={`w-fit px-4 py-2 rounded-lg border-2 font-medium transition-colors ${
                    selectedContact
                      ? 'border-blue-950 bg-blue-950 text-white'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-blue-950 hover:bg-blue-50/30'
                  }`}
                >
                  Select account
                </button>
                {selectedContact && (
                  <p className="text-sm text-gray-600">
                    Selected: {selectedContact.name} ({selectedContact.id_contact})
                  </p>
                )}
                {errors.contactAccount && (
                  <p className="text-sm text-red-500">{errors.contactAccount}</p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-950 text-white font-medium rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Company'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/logged/pages/network/directory/companies')}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </PageContentSection>

      <CompanyRequestSelectModal
        open={requestSelectModalOpen}
        onClose={() => setRequestSelectModalOpen(false)}
        onSelect={(req) => {
          setSelectedRequest(req);
          setRequestSelectModalOpen(false);
        }}
      />
      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl) => {
          update('mainImage', imageUrl);
          setMediatecaOpen(false);
        }}
      />
      <CategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        selectedCategoryNames={form.categoriesArray ? form.categoriesArray.split(',').map((s) => s.trim()).filter(Boolean) : []}
        onSelectCategories={(categories) => {
          update('categoriesArray', categories.map((c) => c.name).join(', '));
          setCategoriesModalOpen(false);
        }}
      />
      {confirmUntagCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-untag-confirm-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="create-untag-confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
              Untag category
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to untag this company as {confirmUntagCategory}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmUntagCategory(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const names = form.categoriesArray
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .filter((n) => n !== confirmUntagCategory);
                  update('categoriesArray', names.join(', '));
                  setConfirmUntagCategory(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Yes, untag
              </button>
            </div>
          </div>
        </div>
      )}
      <CustomerSelectModal
        open={customerSelectModalOpen}
        onClose={() => setCustomerSelectModalOpen(false)}
        onSelectCustomer={(cust) => {
          setSelectedCustomer(cust);
          setCustomerSelectModalOpen(false);
          if (errors.customerAccount) setErrors((e) => ({ ...e, customerAccount: undefined }));
        }}
      />
      <ContactSelectModal
        open={contactSelectModalOpen}
        onClose={() => setContactSelectModalOpen(false)}
        onSelectContact={(cont) => {
          setSelectedContact(cont);
          setContactSelectModalOpen(false);
          if (errors.contactAccount) setErrors((e) => ({ ...e, contactAccount: undefined }));
        }}
      />
    </>
  );
};

export default CreateCompanyProfile;
