'use client';

import React, { FC, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductService } from '@/app/service/ProductService';
import { CompanyService } from '@/app/service/CompanyService';

interface ProductForm {
  productName: string;
  price: string;
  company: string;
  productDescription: string;
  mainImageSrc: string;
  productCategoriesArray: string;
}

const initialForm: ProductForm = {
  productName: '',
  price: '',
  company: '',
  productDescription: '',
  mainImageSrc: '',
  productCategoriesArray: '',
};

function generateProductId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 9);
  return `prod_${t}_${r}`;
}

const CreateProduct: FC = () => {
  const router = useRouter();
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyPortals, setCompanyPortals] = useState<{ portalId: number; portalName: string }[]>([]);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);

  useEffect(() => {
    if (!form.company.trim()) {
      setCompanyPortals([]);
      setSelectedPortalIds([]);
      return;
    }
    CompanyService.getCompanyPortals(form.company.trim())
      .then((list: any[]) => {
        setCompanyPortals(Array.isArray(list) ? list : []);
        setSelectedPortalIds([]);
      })
      .catch(() => {
        setCompanyPortals([]);
        setSelectedPortalIds([]);
      });
  }, [form.company]);

  const handleTogglePortal = (portalId: number) => {
    setSelectedPortalIds((prev) =>
      prev.includes(portalId)
        ? prev.filter((id) => id !== portalId)
        : [...prev, portalId]
    );
  };

  const update = (field: keyof ProductForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ProductForm, string>> = {};
    if (!form.productName.trim()) next.productName = 'Product name is required';
    if (form.price === '') next.price = 'Price is required';
    else {
      const num = parseFloat(form.price);
      if (isNaN(num) || num < 0) next.price = 'Price must be a valid non-negative number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const productId = generateProductId();
      const productCategoriesArray = form.productCategoriesArray
        ? form.productCategoriesArray.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await ProductService.createProduct({
        productId,
        productName: form.productName.trim(),
        price: parseFloat(form.price) || 0,
        company: form.company.trim(),
        productDescription: form.productDescription.trim(),
        mainImageSrc: form.mainImageSrc.trim(),
        productCategoriesArray,
        portalIds: selectedPortalIds,
      });
      router.push('/logged/pages/directory/products');
      router.refresh();
    } catch (error: unknown) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as { message?: string })?.message
          || (error as { data?: { message?: string } })?.data?.message
          || 'Failed to create product';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 bg-white">
      <div className="flex flex-col text-center bg-blue-950/70 p-5 px-46 text-white relative shrink-0">
        <p className="text-2xl">Create Product</p>
        <button
          type="button"
          onClick={() => router.push('/logged/pages/directory/products')}
          className="absolute left-8 top-1/2 -translate-y-1/2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded text-sm transition-colors"
        >
          ← Back to Products
        </button>
      </div>

      <div className="flex-1 overflow-auto px-36 py-8 w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl">
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.productName}
                  onChange={(e) => update('productName', e.target.value)}
                  placeholder="e.g. Energy Efficient Double Pane Window"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                    errors.productName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.productName && (
                  <p className="mt-1 text-sm text-red-500">{errors.productName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  placeholder="e.g. 450.00"
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Company ID <span className="text-gray-400 font-normal">(optional — required for portal assignment)</span>
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => update('company', e.target.value)}
                  placeholder="e.g. comp_1234567_abc123 — enter company ID to assign portals"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>

              {form.company.trim() && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                    Portals (only portals where this company is visible)
                  </label>
                  {companyPortals.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Company not found or has no portals. Enter a valid company ID that is linked to at least one portal.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {companyPortals.map((p) => (
                        <label
                          key={p.portalId}
                          className="flex items-center gap-2 cursor-pointer text-sm border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPortalIds.includes(p.portalId)}
                            onChange={() => handleTogglePortal(p.portalId)}
                            className="rounded border-gray-300"
                          />
                          <span>{p.portalName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Main Image URL
                </label>
                <input
                  type="url"
                  value={form.mainImageSrc}
                  onChange={(e) => update('mainImageSrc', e.target.value)}
                  placeholder="e.g. https://images.example.com/product.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Categories (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.productCategoriesArray}
                  onChange={(e) => update('productCategoriesArray', e.target.value)}
                  placeholder="e.g. Windows, Energy Efficient, Residential"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                  Product Description
                </label>
                <textarea
                  value={form.productDescription}
                  onChange={(e) => update('productDescription', e.target.value)}
                  placeholder="Product description..."
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
              {isSubmitting ? 'Creating...' : 'Create Product'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/logged/pages/directory/products')}
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

export default CreateProduct;
