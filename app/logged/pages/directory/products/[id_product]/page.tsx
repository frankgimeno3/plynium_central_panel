"use client";

import React, { FC, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductService } from '@/app/service/ProductService';
import { CompanyService } from '@/app/service/CompanyService';
import { Product } from '@/app/contents/interfaces';

interface IdProductProps {}

const IdProduct: FC<IdProductProps> = ({ }) => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id_product as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Product | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productPortals, setProductPortals] = useState<
    { portalId: number; portalName: string; slug: string; status: string }[]
  >([]);
  const [companyPortals, setCompanyPortals] = useState<
    { portalId: number; portalName: string }[]
  >([]);
  const [portalActionLoading, setPortalActionLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [companyData, setCompanyData] = useState<{ commercialName: string } | null>(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await ProductService.getProductById(productId);
        if (!cancelled) {
          setProduct(data);
          setFormData({ ...data });
          setInitialData({ ...data });
        }
        const companyId = data?.company?.trim();
        const [productPortalsList, companyPortalsList] = await Promise.all([
          ProductService.getProductPortals(productId).catch(() => []),
          companyId ? CompanyService.getCompanyPortals(companyId).catch(() => []) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setProductPortals(Array.isArray(productPortalsList) ? productPortalsList : []);
          setCompanyPortals(Array.isArray(companyPortalsList) ? companyPortalsList : []);
          if (companyId) {
            CompanyService.getCompanyById(companyId)
              .then((c: { commercialName?: string }) => setCompanyData(c ? { commercialName: c.commercialName ?? companyId } : null))
              .catch(() => setCompanyData(null));
          } else {
            setCompanyData(null);
          }
        }
      } catch {
        if (!cancelled) {
          setProduct(null);
          setFormData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [productId]);

  useEffect(() => {
    if (!formData?.company?.trim()) {
      setCompanyPortals([]);
      return;
    }
    CompanyService.getCompanyPortals(formData.company.trim())
      .then((list: any[]) => setCompanyPortals(Array.isArray(list) ? list : []))
      .catch(() => setCompanyPortals([]));
  }, [formData?.company]);

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (!t || !formData) return;
    const current = formData.productCategoriesArray ?? [];
    if (current.some((c) => c.toLowerCase() === t.toLowerCase())) return;
    handleInputChange('productCategoriesArray', [...current, t]);
  };

  const removeTag = (index: number) => {
    if (!formData) return;
    const current = [...(formData.productCategoriesArray ?? [])];
    current.splice(index, 1);
    handleInputChange('productCategoriesArray', current);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value.trim();
      if (val) addTag(val);
      setTagInput('');
    }
  };

  const handleInputChange = (field: keyof Product, value: string | number | string[]) => {
    if (!formData) return;

    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);

    const hasChanged = JSON.stringify(newFormData) !== JSON.stringify(initialData);
    setHasChanges(hasChanged);
  };

  const handleDelete = async () => {
    if (!productId || !confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await ProductService.deleteProduct(productId);
      const companyId = formData?.company?.trim();
      if (companyId) {
        router.push(`/logged/pages/directory/companies/${encodeURIComponent(companyId)}`);
      } else {
        router.push('/logged/pages/directory/products');
      }
    } catch (error: unknown) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message
          || (error as { data?: { message?: string } })?.data?.message
          || 'Failed to delete product';
      alert(msg);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !initialData) return;
    setSaving(true);
    try {
      await ProductService.updateProduct(productId, {
        productName: formData.productName,
        price: formData.price,
        productDescription: formData.productDescription,
        mainImageSrc: formData.mainImageSrc,
        productCategoriesArray: formData.productCategoriesArray ?? [],
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
        <p className="text-center text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product || !formData) {
    return (
      <div className="flex flex-col w-full bg-white p-8">
        <p className="text-center text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-screen pb-20">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white">
        <p className="text-2xl">Product Details</p>
      </div>

      <div className="px-36 mx-7 mt-8">
        <div className="bg-white border border-gray-100 shadow-xl rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product ID
              </label>
              <input
                type="text"
                value={formData.productId}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company (read-only)
              </label>
              {formData.company?.trim() ? (
                <Link
                  href={`/logged/pages/directory/companies/${encodeURIComponent(formData.company)}`}
                  className="flex flex-col gap-1 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-950/30 transition-colors"
                >
                  <span className="text-xl font-bold text-gray-900">
                    {companyData?.commercialName ?? formData.company}
                  </span>
                  <span className="text-sm text-gray-600">{formData.company}</span>
                </Link>
              ) : (
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm">
                  No company assigned
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Description
              </label>
              <textarea
                value={formData.productDescription}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
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
                  {formData.mainImageSrc ? (
                    <img
                      src={formData.mainImageSrc}
                      alt="Product"
                      className="absolute inset-0 w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span className={`text-gray-400 text-sm ${formData.mainImageSrc ? 'hidden' : ''}`} aria-hidden>
                    No image
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image URL (editable)</label>
                  <input
                    type="text"
                    value={formData.mainImageSrc}
                    onChange={(e) => handleInputChange('mainImageSrc', e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 text-sm"
                  />
                </div>
              </div>
            </div>

            {formData.company?.trim() ? (
              <div className="md:col-span-2 flex flex-row items-start justify-between gap-4">
                <label className="block text-sm font-semibold text-gray-700 shrink-0">
                  Visible in portals
                </label>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  {companyPortals.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Company has no portals. Add the company to portals first from the company edit page.
                    </p>
                  ) : productPortals.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-auto">hidden</p>
                  ) : (
                    <ul className="list-none flex flex-wrap gap-2 justify-end">
                      {productPortals.map((pp) => (
                        <li
                          key={pp.portalId}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm"
                        >
                          <span>{pp.portalName}</span>
                          <button
                            type="button"
                            onClick={async (ev) => {
                              ev.stopPropagation();
                              if (portalActionLoading) return;
                              setPortalActionLoading(true);
                              try {
                                const list = await ProductService.removeProductFromPortal(productId, pp.portalId);
                                setProductPortals(Array.isArray(list) ? list : []);
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
                  {companyPortals.filter((p) => !productPortals.some((pp) => pp.portalId === p.portalId)).length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <select
                        id="add-product-portal-select"
                        disabled={portalActionLoading}
                        className="px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50 max-w-xs"
                        defaultValue=""
                      >
                        <option value="">Select portal to add…</option>
                        {companyPortals
                          .filter((p) => !productPortals.some((pp) => pp.portalId === p.portalId))
                          .map((p) => (
                            <option key={p.portalId} value={p.portalId}>
                              {p.portalName}
                            </option>
                          ))}
                      </select>
                      <button
                        type="button"
                        disabled={portalActionLoading}
                        onClick={async () => {
                          const sel = document.getElementById('add-product-portal-select') as HTMLSelectElement;
                          const portalId = sel?.value ? Number(sel.value) : 0;
                          if (portalId && productId) {
                            setPortalActionLoading(true);
                            try {
                              const list = await ProductService.addProductToPortal(productId, portalId);
                              setProductPortals(Array.isArray(list) ? list : []);
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
            ) : (
              <div className="md:col-span-2 flex flex-row items-center justify-between gap-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Portals
                </label>
                <p className="text-sm text-gray-500 ml-auto">hidden</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (categories)
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.productCategoriesArray || []).map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-950/10 text-blue-950 rounded-lg text-sm font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(idx)}
                      className="text-red-600 hover:text-red-800 font-bold text-base leading-none"
                      aria-label="Remove tag"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={() => {
                  if (tagInput.trim()) addTag(tagInput.trim());
                  setTagInput('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                placeholder="Add tag (Enter or comma)"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:font-bold transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete product'}
        </button>
      </div>
    </div>
  );
};

export default IdProduct;
