"use client";

import React, { FC, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CompanyService } from '@/app/service/CompanyService';
import { Company } from '@/app/contents/interfaces';

interface IdCompanyProps {}

const IdCompany: FC<IdCompanyProps> = ({ }) => {
  const params = useParams();
  const companyId = params.id_company as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Company | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await CompanyService.getCompanyById(companyId);
        if (!cancelled) {
          setCompany(data);
          setFormData({ ...data });
          setInitialData({ ...data });
        }
      } catch {
        if (!cancelled) {
          setCompany(null);
          setFormData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [companyId]);

  const handleInputChange = (field: keyof Company, value: string | string[]) => {
    if (!formData) return;

    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);

    const hasChanged = JSON.stringify(newFormData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  };

  const handleSave = async () => {
    if (!formData || !initialData) return;
    setSaving(true);
    try {
      await CompanyService.updateCompany(companyId, {
        commercialName: formData.commercialName,
        country: formData.country,
        category: formData.category,
        mainDescription: formData.mainDescription,
        mainImage: formData.mainImage,
        productsArray: formData.productsArray ?? [],
        categoriesArray: formData.categoriesArray ?? [],
        mainEmail: formData.mainEmail,
        mailTelephone: formData.mailTelephone,
        fullAddress: formData.fullAddress,
        webLink: formData.webLink,
      });
      setInitialData({ ...formData });
      setHasChanges(false);
    } catch (error: unknown) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message
          || (error as { data?: { message?: string } })?.data?.message
          || 'Failed to save';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col w-full bg-white p-8">
        <p className="text-center text-gray-500">Loading company...</p>
      </div>
    );
  }

  if (!company || !formData) {
    return (
      <div className="flex flex-col w-full bg-white p-8">
        <p className="text-center text-gray-500">Company not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Company Details</p>
      </div>

      <div className="px-36 mx-7 mt-8">
        <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company ID
              </label>
              <input
                type="text"
                value={formData.companyId}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Commercial Name
              </label>
              <input
                type="text"
                value={formData.commercialName}
                onChange={(e) => handleInputChange('commercialName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Main Description
              </label>
              <textarea
                value={formData.mainDescription}
                onChange={(e) => handleInputChange('mainDescription', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Main Image
              </label>
              <div className="flex flex-col gap-3">
                <div className="relative w-full max-w-md h-64 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                  {formData.mainImage ? (
                    <img
                      src={formData.mainImage}
                      alt="Company"
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-gray-400 text-sm ${formData.mainImage ? 'hidden' : ''}`} aria-hidden>
                    No image
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL (editable)</label>
                  <input
                    type="text"
                    value={formData.mainImage}
                    onChange={(e) => handleInputChange('mainImage', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Main Email
              </label>
              <input
                type="email"
                value={formData.mainEmail}
                onChange={(e) => handleInputChange('mainEmail', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telephone
              </label>
              <input
                type="text"
                value={formData.mailTelephone}
                onChange={(e) => handleInputChange('mailTelephone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Address
              </label>
              <input
                type="text"
                value={formData.fullAddress}
                onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Web Link
              </label>
              <input
                type="text"
                value={formData.webLink}
                onChange={(e) => handleInputChange('webLink', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Products Array (comma-separated IDs)
              </label>
              <input
                type="text"
                value={(formData.productsArray || []).join(', ')}
                onChange={(e) => handleInputChange('productsArray', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="prod-001, prod-002, prod-003"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Categories Array (comma-separated)
              </label>
              <input
                type="text"
                value={(formData.categoriesArray || []).join(', ')}
                onChange={(e) => handleInputChange('categoriesArray', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Category 1, Category 2, Category 3"
              />
            </div>
          </div>
        </div>
      </div>

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:font-bold transition-all z-50 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      )}
    </div>
  );
};

export default IdCompany;
