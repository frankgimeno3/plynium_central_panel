"use client";

import React, { FC, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CompanyService } from '@/app/service/CompanyService';
import { PortalService } from '@/app/service/PortalService';
import { ProductService } from '@/app/service/ProductService';
import { Company } from '@/app/contents/interfaces';

interface IdCompanyProps {}

const IdCompany: FC<IdCompanyProps> = ({ }) => {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id_company as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState<Company | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyPortals, setCompanyPortals] = useState<
    { portalId: number; portalName: string; slug: string; status: string }[]
  >([]);
  const [allPortals, setAllPortals] = useState<{ id: number; name: string }[]>([]);
  const [portalActionLoading, setPortalActionLoading] = useState(false);
  const [companyProducts, setCompanyProducts] = useState<
    { productId: string; productName: string; price: number; mainImageSrc?: string; productCategoriesArray?: string[] }[]
  >([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [data, portalsList, companyPortalsList, productsList] = await Promise.all([
          CompanyService.getCompanyById(companyId),
          PortalService.getAllPortals(),
          CompanyService.getCompanyPortals(companyId).catch(() => []),
          ProductService.getProductsByCompany(companyId).catch(() => []),
        ]);
        if (!cancelled) {
          setCompany(data);
          setFormData({ ...data });
          setInitialData({ ...data });
          setAllPortals(
            Array.isArray(portalsList)
              ? portalsList.map((p: any) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
              : []
          );
          setCompanyPortals(Array.isArray(companyPortalsList) ? companyPortalsList : []);
          setCompanyProducts(Array.isArray(productsList) ? productsList : []);
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
                Visible in portals
              </label>
              <div className="flex flex-col gap-2">
                {companyPortals.length === 0 ? (
                  <p className="text-sm text-gray-400">Not visible in any portal yet.</p>
                ) : (
                  <ul className="list-none flex flex-wrap gap-2">
                    {companyPortals.map((cp) => (
                      <li
                        key={cp.portalId}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                      >
                        <span>{cp.portalName}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (portalActionLoading) return;
                            setPortalActionLoading(true);
                            try {
                              const list = await CompanyService.removeCompanyFromPortal(companyId, cp.portalId);
                              setCompanyPortals(Array.isArray(list) ? list : []);
                            } catch (e: any) {
                              alert(e?.message || e?.data?.message || 'Error removing from portal');
                            } finally {
                              setPortalActionLoading(false);
                            }
                          }}
                          disabled={portalActionLoading}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {allPortals.filter((p) => !companyPortals.some((cp) => cp.portalId === p.id)).length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      id="add-company-portal-select"
                      disabled={portalActionLoading}
                      className="px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50 max-w-xs"
                      defaultValue=""
                    >
                      <option value="">Select portal to add…</option>
                      {allPortals
                        .filter((p) => !companyPortals.some((cp) => cp.portalId === p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      disabled={portalActionLoading}
                      onClick={async () => {
                        const sel = document.getElementById('add-company-portal-select') as HTMLSelectElement;
                        const portalId = sel?.value ? Number(sel.value) : 0;
                        if (portalId && companyId) {
                          setPortalActionLoading(true);
                          try {
                            const list = await CompanyService.addCompanyToPortal(companyId, portalId);
                            setCompanyPortals(Array.isArray(list) ? list : []);
                            sel.value = '';
                          } catch (e: any) {
                            alert(e?.message || e?.data?.message || 'Error adding to portal');
                          } finally {
                            setPortalActionLoading(false);
                          }
                        }
                      }}
                      className="px-3 py-2 text-xs rounded-xl bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50"
                    >
                      {portalActionLoading ? '…' : 'Add to portal'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Products (linked to this company)
              </label>
              {companyProducts.length === 0 ? (
                <p className="text-sm text-gray-500">No products linked to this company.</p>
              ) : (
                <div className="overflow-x-auto border border-gray-300 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300" style={{ width: 72, minWidth: 72 }}>
                          Image
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Product ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Product Name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300">
                          Categories
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyProducts.map((prod) => (
                        <tr
                          key={prod.productId}
                          onClick={() => router.push(`/logged/pages/directory/products/${encodeURIComponent(prod.productId)}`)}
                          className="hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-3 py-2 border-b border-gray-200 align-middle" style={{ width: 72, minWidth: 72, verticalAlign: 'middle' }}>
                            <div
                              className="relative rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center"
                              style={{ width: 56, height: 56, minWidth: 56, minHeight: 56, boxSizing: 'border-box' }}
                            >
                              {prod.mainImageSrc ? (
                                <img
                                  src={prod.mainImageSrc}
                                  alt=""
                                  className="absolute inset-0 w-full h-full object-cover"
                                  style={{ display: 'block' }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null}
                              <span className={`text-gray-400 text-xs ${prod.mainImageSrc ? 'hidden' : ''}`} aria-hidden>—</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                            {prod.productId}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                            {prod.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200">
                            ${Number(prod.price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200">
                            {(prod.productCategoriesArray || []).join(', ') || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
