'use client';

import React, { FC, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import countriesRegions from '@/app/contents/countries_regions.json';
import { COMPANIES_MEDIA_LIBRARY_PATH } from '@/app/contents/mediatecaPaths';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { CompanyService } from '@/app/service/CompanyService';
import { CustomerService } from '@/app/service/CustomerService';
import { PortalService } from '@/app/service/PortalService';
import { useCompanyRequests } from '@/app/logged/pages/tickets/hooks/useCompanyRequests';
import CompanyRequestSelectModal from '@/app/logged/logged_components/modals/CompanyRequestSelectModal';
import MediatecaModal from '@/app/logged/logged_components/modals/MediatecaModal';
import CategoriesModal, { type CategoryItem } from '@/app/logged/logged_components/modals/CategoriesModal';
import CustomerSelectModal from '@/app/logged/logged_components/modals/CustomerSelectModal';
import ContactSelectModal from '@/app/logged/logged_components/modals/ContactSelectModal';
import type { CompanyRequest } from '@/app/logged/pages/tickets/hooks/useCompanyRequests';
import type { CustomerRow } from '@/app/logged/logged_components/modals/CustomerSelectModal';
import type { ContactRow } from '@/app/logged/logged_components/modals/ContactSelectModal';
import { RichTextEditor } from '@/app/logged/logged_components/RichTextEditor';

type RegionValue =
  | 'europe'
  | 'africa'
  | 'asia'
  | 'north america'
  | 'center & south america'
  | 'oceania';

function normalizeCountryKey(value: string) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9\s'()-]/g, '')
    .replace(/\s+/g, ' ');
}

function toTitleCaseRegion(value: string) {
  const v = String(value ?? '').trim();
  if (!v) return '';
  return v
    .split(' ')
    .map((w) => (w === '&' ? '&' : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ');
}

type Step = 1 | 2 | 3 | 4 | 5;

interface CompanyForm {
  commercialName: string;
  country: string;
  mainDescription: string;
  mainImage: string;
  mainEmail: string;
  phonePrefix: string;
  phoneNumber: string;
  fullAddress: string;
  webLink: string;
}

type FormErrors = Partial<
  Record<keyof CompanyForm | 'portals' | 'customerAccount' | 'contactAccount' | 'companyRequest', string>
>;

const initialForm: CompanyForm = {
  commercialName: '',
  country: '',
  mainDescription: '',
  mainImage: '',
  mainEmail: '',
  phonePrefix: '',
  phoneNumber: '',
  fullAddress: '',
  webLink: '',
};

function generateCompanyId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 9);
  return `comp_${t}_${r}`;
}

function normalizeWebsiteUrl(raw: string): string {
  const t = String(raw ?? '').trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

type PortalOption = { id: number; name: string };

/** RDS `portal_id` — reject 0/NaN (Joi requires integer >= 1). */
function parsePortalId(raw: unknown): number | null {
  const n =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.trunc(raw)
      : parseInt(String(raw ?? ''), 10);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

function normalizePortalsFromApi(list: unknown): PortalOption[] {
  if (!Array.isArray(list)) return [];
  return list
    .map((p: { id?: unknown; portal_id?: unknown; name?: unknown; key?: unknown }) => {
      const id = parsePortalId(p?.id ?? p?.portal_id);
      if (id == null) return null;
      const name =
        p?.name != null
          ? String(p.name).trim()
          : String(p?.key ?? id).trim();
      return { id, name: name || `Portal ${id}` };
    })
    .filter((row): row is PortalOption => row != null);
}

function sanitizePortalIds(ids: number[]): number[] {
  return ids.map((id) => parsePortalId(id)).filter((id): id is number => id != null);
}

export type CreateCompanyWizardProps = {
  /** `customer_id` from `/companies/create/from_customer/[customer_id]` — prefills the wizard and creates `customer_company_relations` on submit. */
  embeddedCustomerId?: string | null;
};

const stepLabels: Record<Step, string> = {
  1: 'Company request',
  2: 'Basic data & portals',
  3: 'Categories & description',
  4: 'Account associations',
  5: 'Preview',
};

const CreateCompanyWizard: FC<CreateCompanyWizardProps> = ({ embeddedCustomerId = null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkCustomerId = (embeddedCustomerId?.trim() || searchParams.get('customerId') || '').trim();
  const { updateState } = useCompanyRequests();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portals, setPortals] = useState<PortalOption[]>([]);
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
  const [linkedCustomer, setLinkedCustomer] = useState<
    CustomerRow & {
      address?: string;
      postal_code?: string;
      phone?: string;
      email?: string;
      website?: string;
      industry?: string;
      owner?: string;
    } | null
  >(null);
  const [linkedCustomerLoading, setLinkedCustomerLoading] = useState(false);
  const [linkedCustomerError, setLinkedCustomerError] = useState<string | null>(null);
  const prefillAppliedRef = useRef(false);
  const [confirmUntagCategory, setConfirmUntagCategory] = useState<string | null>(null);
  const [pickedCategories, setPickedCategories] = useState<CategoryItem[]>([]);
  const [countrySuggestOpen, setCountrySuggestOpen] = useState(false);
  const countryFieldRef = useRef<HTMLDivElement>(null);

  const regionByCountry = useMemo(() => {
    const map = new Map<string, RegionValue>();
    const list = Array.isArray(countriesRegions)
      ? (countriesRegions as { country?: string; region?: string }[])
      : [];
    for (const item of list) {
      const c = normalizeCountryKey(String(item?.country ?? ''));
      const r = String(item?.region ?? '').trim().toLowerCase() as RegionValue;
      if (!c || !r) continue;
      map.set(c, r);
    }
    return map;
  }, []);

  const countrySet = useMemo(() => {
    const set = new Set<string>();
    const list = Array.isArray(countriesRegions)
      ? (countriesRegions as { country?: string }[])
      : [];
    for (const item of list) {
      const c = normalizeCountryKey(String(item?.country ?? ''));
      if (c) set.add(c);
    }
    return set;
  }, []);

  const sortedCountryNames = useMemo(() => {
    const list = Array.isArray(countriesRegions)
      ? (countriesRegions as { country?: string }[])
      : [];
    const names = list.map((x) => String(x?.country ?? '').trim()).filter(Boolean);
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredCountryOptions = useMemo(() => {
    const q = normalizeCountryKey(form.country);
    if (!q) return [];
    return sortedCountryNames
      .filter((c) => normalizeCountryKey(c).includes(q))
      .slice(0, 20);
  }, [form.country, sortedCountryNames]);

  const derivedRegion = useMemo(() => {
    const c = normalizeCountryKey(form.country ?? '');
    const r = regionByCountry.get(c);
    return r ? toTitleCaseRegion(r) : '';
  }, [form.country, regionByCountry]);

  const isCountryAllowed = useCallback(
    (raw: string) => {
      const v = String(raw ?? '').trim();
      if (!v) return false;
      return countrySet.has(normalizeCountryKey(v));
    },
    [countrySet]
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!countrySuggestOpen) return;
      const el = countryFieldRef.current;
      if (el && !el.contains(e.target as Node)) setCountrySuggestOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [countrySuggestOpen]);

  useEffect(() => {
    prefillAppliedRef.current = false;
  }, [linkCustomerId]);

  useEffect(() => {
    if (!linkCustomerId) {
      setLinkedCustomer(null);
      setLinkedCustomerLoading(false);
      setLinkedCustomerError(null);
      return;
    }
    let cancelled = false;
    setLinkedCustomerLoading(true);
    setLinkedCustomerError(null);
    CustomerService.getCustomerById(linkCustomerId)
      .then(
        (
          data: CustomerRow & {
            address?: string;
            postal_code?: string;
            phone?: string;
            email?: string;
            website?: string;
            industry?: string;
            owner?: string;
          }
        ) => {
        if (!cancelled) setLinkedCustomer(data);
      })
      .catch(() => {
        if (!cancelled) {
          setLinkedCustomer(null);
          setLinkedCustomerError('Could not load this customer account.');
        }
      })
      .finally(() => {
        if (!cancelled) setLinkedCustomerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [linkCustomerId]);

  useEffect(() => {
    if (!linkCustomerId || !linkedCustomer || prefillAppliedRef.current) return;
    const id = String(linkedCustomer.id_customer ?? '').trim();
    if (!id || id !== linkCustomerId) return;
    prefillAppliedRef.current = true;
    const addrParts = [linkedCustomer.address, linkedCustomer.postal_code].filter((x) => String(x ?? '').trim());
    const fullAddr = addrParts.join(', ').trim();
    const rawPhone = String(linkedCustomer.phone || '').trim() || '';
    // Very light split: if it starts with +NN, use that as prefix.
    const m = rawPhone.match(/^(\+\d{1,4})[\s-]?(.*)$/);
    const prefillPrefix = m ? (m[1] ?? '') : '';
    const prefillNumber = m ? String(m[2] ?? '').trim() : rawPhone;
    setForm((prev) => ({
      ...prev,
      commercialName: (linkedCustomer.name || '').trim() || prev.commercialName,
      country: (linkedCustomer.country || '').trim() || prev.country,
      mainEmail: (linkedCustomer.email || '').trim() || prev.mainEmail,
      phonePrefix: prefillPrefix || prev.phonePrefix,
      phoneNumber: prefillNumber || prev.phoneNumber,
      fullAddress: fullAddr || prev.fullAddress,
      webLink: normalizeWebsiteUrl(String(linkedCustomer.website || '')) || prev.webLink,
      mainDescription: (linkedCustomer.industry || '').trim() || prev.mainDescription,
    }));
    setSelectedCustomer({
      id_customer: id,
      name: linkedCustomer.name || '',
      cif: linkedCustomer.cif || '',
      country: linkedCustomer.country || '',
    });
    setAssociatedToCustomer(true);
    setCreateNewCustomer(false);
  }, [linkCustomerId, linkedCustomer]);

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list: unknown) => {
        setPortals(normalizePortalsFromApi(list));
      })
      .catch(() => setPortals([]));
  }, []);

  useEffect(() => {
    if (portals.length === 0) return;
    const allowed = new Set(portals.map((p) => p.id));
    setSelectedPortalIds((prev) => sanitizePortalIds(prev).filter((id) => allowed.has(id)));
  }, [portals]);

  const handleTogglePortal = (portalId: number) => {
    const id = parsePortalId(portalId);
    if (id == null) return;
    setSelectedPortalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const update = (field: keyof CompanyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep2 = (): boolean => {
    const next: FormErrors = {};
    if (!form.commercialName.trim()) next.commercialName = 'Commercial name is required';
    if (!form.country.trim()) next.country = 'Country is required';
    else if (!isCountryAllowed(form.country)) {
      next.country = 'Choose a country from the list (type to search, then pick one option).';
    }
    if (!form.mainEmail.trim()) next.mainEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mainEmail)) next.mainEmail = 'Invalid email format';
    const validPortalIds = sanitizePortalIds(selectedPortalIds);
    if (portals.length > 0 && validPortalIds.length === 0) {
      next.portals = 'Select at least one portal';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateStep1 = (): boolean => {
    if (associatedToRequest && !selectedRequest) {
      setErrors({ companyRequest: 'Select a company request, or set "No" if this company is not tied to a request.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep4 = (): boolean => {
    if (linkCustomerId) return true;
    const next: FormErrors = {};
    if (associatedToCustomer && !selectedCustomer && !createNewCustomer) {
      next.customerAccount = 'Select an existing customer account or choose "Create new customer account with this data".';
    }
    if (associatedToContact && !selectedContact) {
      next.contactAccount = 'Select a contact account.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateFull = (): boolean => {
    if (associatedToRequest && !selectedRequest) {
      setErrors({ companyRequest: 'Select a company request, or set "No" if this company is not tied to a request.' });
      setStep(1);
      return false;
    }
    if (!validateStep2()) return false;
    if (!validateStep4()) return false;
    return true;
  };

  const goNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setErrors({});
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4 && validateStep4()) {
      setErrors({});
      setStep(5);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateFull()) return;
    setIsSubmitting(true);
    try {
      const phone = [form.phonePrefix, form.phoneNumber].map((x) => String(x ?? '').trim()).filter(Boolean).join(' ');
      const companyId = generateCompanyId();
      const categoriesArray = pickedCategories.map((c) => c.name);
      const categoryIds = pickedCategories.map((c) => c.id_category);
      const portalIds = sanitizePortalIds(selectedPortalIds);
      if (portals.length > 0 && portalIds.length === 0) {
        setErrors({ portals: 'Select at least one valid portal.' });
        setStep(2);
        setIsSubmitting(false);
        return;
      }
      await CompanyService.createCompany({
        companyId,
        commercialName: form.commercialName.trim(),
        country: form.country.trim(),
        region: derivedRegion,
        mainDescription: form.mainDescription.trim(),
        mainImage: form.mainImage.trim(),
        productsArray: [],
        categoriesArray,
        categoryIds,
        mainEmail: form.mainEmail.trim(),
        mailTelephone: phone,
        fullAddress: form.fullAddress.trim(),
        webLink: form.webLink.trim(),
        portalIds,
      });
      const relationCustomerId =
        linkCustomerId ||
        (associatedToCustomer && !createNewCustomer && selectedCustomer?.id_customer
          ? selectedCustomer.id_customer
          : '');
      if (relationCustomerId) {
        try {
          await CustomerService.createCustomerCompanyRelation({
            customer_id: relationCustomerId,
            company_id: companyId,
          });
        } catch (relErr: unknown) {
          const msg =
            relErr instanceof Error
              ? relErr.message
              : typeof relErr === 'object' && relErr && 'message' in relErr
                ? String((relErr as { message?: string }).message)
                : 'Unknown error';
          alert(
            `The company was created, but linking it to the customer account failed: ${msg}. You can link them manually from the customer page (Directory companies) or the company page.`
          );
        }
      }
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
    { label: 'Companies', href: '/logged/pages/network/directory/companies' },
    { label: 'Create company' },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: 'Create Company',
      breadcrumbs,
      buttons: [{ label: 'Back to Companies', href: '/logged/pages/network/directory/companies' }],
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection className="!px-0 p-0 bg-gray-50 min-h-[calc(100vh-6rem)] flex justify-center py-8">
        <div className="flex flex-col w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 bg-gray-50 px-4 sm:px-6 py-4">
            <div className="flex items-center gap-4">
              {([1, 2, 3, 4, 5] as Step[]).map((s) => (
                <React.Fragment key={s}>
                  <button
                    type="button"
                    onClick={() => s < step && setStep(s)}
                    className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                      step === s
                        ? 'bg-blue-600 text-white'
                        : step > s
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-500'
                    } ${step > s ? 'cursor-pointer' : ''}`}
                  >
                    {s}
                  </button>
                  {s < 5 && <span className="w-6 h-0.5 bg-gray-300" />}
                </React.Fragment>
              ))}
              <span className="text-sm text-gray-600 ml-2">{stepLabels[step]}</span>
            </div>
          </div>

          <div className="w-full overflow-hidden bg-white p-5 md:p-8">
            {/* Step 1: Is this associated to a company request? */}
            {step === 1 && (
              <div className="space-y-6">
                {linkCustomerId && (
                  <>
                    {linkedCustomerLoading && (
                      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                        Loading customer account…
                      </div>
                    )}
                    {linkedCustomerError && (
                      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                        {linkedCustomerError}
                      </div>
                    )}
                    {linkedCustomer && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-5 text-gray-900">
                        <p className="text-sm font-semibold text-blue-950">Existing CRM customer</p>
                        <p className="mt-2 text-sm leading-relaxed text-blue-950/95">
                          You are creating a directory company from an existing customer account that is already present in
                          the network directory. Values from this customer are suggested in the following steps and remain
                          fully editable.
                        </p>
                        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Customer ID</dt>
                            <dd>
                              <code className="rounded bg-white/90 px-1 font-mono text-xs">{linkedCustomer.id_customer}</code>
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Account name</dt>
                            <dd className="font-medium text-gray-900">{linkedCustomer.name || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Country</dt>
                            <dd>{linkedCustomer.country || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Tax ID (CIF)</dt>
                            <dd>{linkedCustomer.cif || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Email</dt>
                            <dd className="break-all">{linkedCustomer.email || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Phone</dt>
                            <dd>{linkedCustomer.phone || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Website</dt>
                            <dd className="break-all">{linkedCustomer.website || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Industry</dt>
                            <dd>{linkedCustomer.industry || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Agent</dt>
                            <dd>{linkedCustomer.owner || '—'}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">Address</dt>
                            <dd>
                              {[linkedCustomer.address, linkedCustomer.postal_code].filter((x) => String(x ?? '').trim()).join(', ') || '—'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    )}
                  </>
                )}
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="block text-sm font-medium text-gray-700">
                    Is this associated to a company request?
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
                            if (!e.target.checked) {
                              setSelectedRequest(null);
                              setErrors((prev) => ({ ...prev, companyRequest: undefined }));
                            }
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
                {errors.companyRequest && (
                  <p className="text-sm text-red-600" role="alert">
                    {errors.companyRequest}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={Boolean(linkCustomerId && linkedCustomerLoading)}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next: Basic data & portals
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Basic data up to portals */}
            {step === 2 && (
              <div className="space-y-6">
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
                    <div className="relative" ref={countryFieldRef}>
                      <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => {
                          update('country', e.target.value);
                          setCountrySuggestOpen(true);
                        }}
                        onFocus={() => setCountrySuggestOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setCountrySuggestOpen(false), 150);
                        }}
                        autoComplete="off"
                        role="combobox"
                        aria-expanded={countrySuggestOpen}
                        aria-autocomplete="list"
                        aria-controls="create-company-country-listbox"
                        placeholder="Type to search countries…"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                          errors.country ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {countrySuggestOpen && filteredCountryOptions.length > 0 && (
                        <ul
                          id="create-company-country-listbox"
                          role="listbox"
                          className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                        >
                          {filteredCountryOptions.map((name) => (
                            <li key={name} role="presentation">
                              <button
                                type="button"
                                role="option"
                                className="w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-blue-50"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => {
                                  update('country', name);
                                  setCountrySuggestOpen(false);
                                }}
                              >
                                {name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {errors.country && (
                        <p className="mt-1 text-sm text-red-500">{errors.country}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                        Region <span className="text-gray-400 font-semibold normal-case">(automatic)</span>
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={derivedRegion || '—'}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                       />
                      <p className="mt-1 text-xs text-gray-500">Set automatically from the country (directory JSON).</p>
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
                      <div className="flex w-full gap-2">
                        <input
                          type="text"
                          inputMode="tel"
                          value={form.phonePrefix}
                          onChange={(e) => update('phonePrefix', e.target.value)}
                          placeholder="+34"
                          className="w-14 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                        />
                        <input
                          type="text"
                          inputMode="tel"
                          value={form.phoneNumber}
                          onChange={(e) => update('phoneNumber', e.target.value)}
                          placeholder="123123123"
                          className="min-w-0 flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                        />
                      </div>
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
                          <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                            <div className="flex">
                              <div
                                className="relative flex aspect-[5/2] w-[180px] max-w-full items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 shadow"
                                style={{ boxSizing: "border-box" }}
                              >
                                <img
                                  src={form.mainImage}
                                  alt="Main"
                                  className="absolute inset-0 h-full w-full object-cover object-center"
                                  style={{ display: "block" }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                                  }}
                                />
                                <span className="hidden text-gray-400 text-xs font-medium" aria-hidden>
                                  —
                                </span>
                              </div>
                            </div>
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <span className="truncate text-sm text-gray-600" title={form.mainImage}>
                                {form.mainImage}
                              </span>
                              <button
                                type="button"
                                onClick={() => update('mainImage', '')}
                                className="shrink-0 text-sm font-medium text-red-600 hover:text-red-800"
                              >
                                Clear
                              </button>
                            </div>
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
                      {errors.portals && (
                        <p className="mt-1 text-sm text-red-500">{errors.portals}</p>
                      )}
                    </div>
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
                    disabled={
                      !form.commercialName.trim()
                      || !form.country.trim()
                      || !isCountryAllowed(form.country)
                      || !form.mainEmail.trim()
                      || (portals.length > 0 && sanitizePortalIds(selectedPortalIds).length === 0)
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next: Categories & description
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Categories and main description */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div>
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
                      {pickedCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          {pickedCategories.map((cat) => (
                            <span
                              key={cat.id_category}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 rounded-lg text-sm font-medium"
                            >
                              {cat.name}
                              <button
                                type="button"
                                onClick={() => setConfirmUntagCategory(cat.name)}
                                className="text-blue-700 hover:text-red-700 font-bold leading-none"
                                aria-label={`Remove ${cat.name}`}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                      Main Description
                    </label>
                    <RichTextEditor
                      value={form.mainDescription}
                      onChange={(html) => update('mainDescription', html)}
                      placeholder="Write company description..."
                      minHeight="160px"
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
                    Next: Account associations
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: customers_db and (if yes) contacts_db */}
            {step === 4 && (
              <div className="space-y-6">
                {linkCustomerId ? (
                  <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-5 text-gray-900">
                    <p className="text-sm font-semibold text-blue-950">CRM customer link</p>
                    <p className="mt-2 text-sm leading-relaxed text-blue-950/95">
                      After you create this directory company, it will be linked to customer account{' '}
                      <span className="font-semibold">{linkedCustomer?.name ?? selectedCustomer?.name ?? '—'}</span>{' '}
                      (<code className="rounded bg-white/90 px-1 font-mono text-xs">{linkCustomerId}</code>). A row will be
                      added in <span className="font-medium">customer_company_relations</span>.
                    </p>
                  </div>
                ) : (
                  <>
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
                              setAssociatedToContact(false);
                              setSelectedContact(null);
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

                {associatedToCustomer && (
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
                )}
                  </>
                )}

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

            {/* Step 5: Preview with large image and submit */}
            {step === 5 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <p className="text-sm font-semibold text-gray-700 p-4 border-b border-gray-200">Preview</p>
                  {form.mainImage ? (
                    <div className="aspect-[5/2] w-full max-h-72 min-h-[8rem] bg-gray-100">
                      <img
                        src={form.mainImage}
                        alt={form.commercialName || 'Company'}
                        className="h-full w-full object-cover object-top"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[5/2] w-full max-h-72 min-h-[8rem] items-center justify-center bg-gray-100 text-sm text-gray-400">
                      No main image
                    </div>
                  )}
                  <dl className="p-6 space-y-3 text-sm">
                    {linkCustomerId && (linkedCustomer || selectedCustomer) && (
                      <div>
                        <dt className="text-gray-500">Linked CRM customer</dt>
                        <dd className="font-medium text-gray-900">
                          {(linkedCustomer?.name ?? selectedCustomer?.name) || '—'} ({linkCustomerId})
                        </dd>
                      </div>
                    )}
                    {associatedToRequest && selectedRequest && (
                      <div>
                        <dt className="text-gray-500">Associated request</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedRequest.companyRequestId} — {selectedRequest.content.nombre_comercial} ({selectedRequest.content.pais_empresa})
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Commercial name</dt>
                      <dd className="font-medium text-gray-900">{form.commercialName || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Country</dt>
                      <dd className="font-medium text-gray-900">{form.country || '—'}</dd>
                    </div>
                    {derivedRegion && (
                      <div>
                        <dt className="text-gray-500">Region</dt>
                        <dd className="font-medium text-gray-900">{derivedRegion}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-gray-500">Main email</dt>
                      <dd className="font-medium text-gray-900">{form.mainEmail || '—'}</dd>
                    </div>
                    {(([form.phonePrefix, form.phoneNumber].some((x) => String(x ?? "").trim())) || form.webLink || form.fullAddress) && (
                      <>
                        {[form.phonePrefix, form.phoneNumber].some((x) => String(x ?? "").trim()) && (
                          <div>
                            <dt className="text-gray-500">Telephone</dt>
                            <dd className="font-medium text-gray-900">
                              {[form.phonePrefix, form.phoneNumber].map((x) => String(x ?? "").trim()).filter(Boolean).join(" ")}
                            </dd>
                          </div>
                        )}
                        {form.webLink && (
                          <div>
                            <dt className="text-gray-500">Web link</dt>
                            <dd className="font-medium text-gray-900 break-all">{form.webLink}</dd>
                          </div>
                        )}
                        {form.fullAddress && (
                          <div>
                            <dt className="text-gray-500">Full address</dt>
                            <dd className="font-medium text-gray-900">{form.fullAddress}</dd>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <dt className="text-gray-500">Portals</dt>
                      <dd className="font-medium text-gray-900">
                        {selectedPortalIds.length > 0
                          ? portals.filter((p) => selectedPortalIds.includes(p.id)).map((p) => p.name).join(', ')
                          : '—'}
                      </dd>
                    </div>
                    {pickedCategories.length > 0 && (
                      <div>
                        <dt className="text-gray-500">Categories</dt>
                        <dd className="flex flex-wrap gap-2 mt-1">
                          {pickedCategories.map((cat) => (
                            <span
                              key={cat.id_category}
                              className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium"
                            >
                              {cat.name}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}
                    {form.mainDescription && (
                      <div>
                        <dt className="text-gray-500">Main description</dt>
                        <dd className="font-medium text-gray-900 break-words" dangerouslySetInnerHTML={{ __html: form.mainDescription }} />
                      </div>
                    )}
                    {associatedToCustomer && !linkCustomerId && (
                      <div>
                        <dt className="text-gray-500">Customers DB</dt>
                        <dd className="font-medium text-gray-900">
                          {createNewCustomer ? 'Create new customer account with this data' : selectedCustomer ? `${selectedCustomer.name} (${selectedCustomer.id_customer})` : '—'}
                        </dd>
                      </div>
                    )}
                    {associatedToCustomer && associatedToContact && (
                      <div>
                        <dt className="text-gray-500">Contacts DB</dt>
                        <dd className="font-medium text-gray-900">
                          {selectedContact ? `${selectedContact.name} (${selectedContact.id_contact})` : '—'}
                        </dd>
                      </div>
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
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Company'}
                  </button>
                </div>
              </form>
            )}
          </div>
          </div>
        </div>
      </PageContentSection>

      <CompanyRequestSelectModal
        open={requestSelectModalOpen}
        onClose={() => setRequestSelectModalOpen(false)}
        onSelect={(req) => {
          setSelectedRequest(req);
          setRequestSelectModalOpen(false);
          setErrors((prev) => ({ ...prev, companyRequest: undefined }));
        }}
      />
      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl) => {
          update('mainImage', imageUrl);
          setMediatecaOpen(false);
        }}
        initialPath={COMPANIES_MEDIA_LIBRARY_PATH}
      />
      <CategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        selectedCategoryNames={pickedCategories.map((c) => c.name)}
        onSelectCategories={(categories) => {
          setPickedCategories(categories);
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
                  setPickedCategories((prev) => prev.filter((c) => c.name !== confirmUntagCategory));
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

export { CreateCompanyWizard };
