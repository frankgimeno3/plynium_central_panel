'use client';

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyService } from '@/app/service/CompanyService';
import { PortalService } from '@/app/service/PortalService';

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
  const [form, setForm] = useState<CompanyForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);

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
    const next: Partial<Record<keyof CompanyForm, string>> = {};
    if (!form.commercialName.trim()) next.commercialName = 'Commercial name is required';
    if (!form.country.trim()) next.country = 'Country is required';
    if (!form.category.trim()) next.category = 'Category is required';
    if (!form.mainEmail.trim()) next.mainEmail = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.mainEmail)) next.mainEmail = 'Invalid email format';
    if (portals.length > 0 && selectedPortalIds.length === 0) next.portals = 'Select at least one portal';
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
      router.push('/logged/pages/directory/companies');
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

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white relative shrink-0">
        <p className="text-2xl">Create Company</p>
        <button
          type="button"
          onClick={() => router.push('/logged/pages/directory/companies')}
          className="absolute left-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
        >
          ← Back to Companies
        </button>
      </div>

      <div className="flex-1 overflow-auto px-36 py-8 w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl">
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
                  Main Image URL
                </label>
                <input
                  type="url"
                  value={form.mainImage}
                  onChange={(e) => update('mainImage', e.target.value)}
                  placeholder="e.g. https://images.example.com/company.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
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
                  Categories (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.categoriesArray}
                  onChange={(e) => update('categoriesArray', e.target.value)}
                  placeholder="e.g. Windows, Doors, Architectural Glass"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
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
              onClick={() => router.push('/logged/pages/directory/companies')}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCompanyProfile;
