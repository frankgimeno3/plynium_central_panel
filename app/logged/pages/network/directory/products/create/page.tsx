'use client';

import React, { FC, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { ProductService } from '@/app/service/ProductService';
import { CompanyService } from '@/app/service/CompanyService';
import CompanyDirectorySelectModal from '@/app/logged/logged_components/modals/CompanyDirectorySelectModal';
import MediatecaModal from '@/app/logged/logged_components/modals/MediatecaModal';
import CategoriesModal from '@/app/logged/logged_components/modals/CategoriesModal';
import type { CategoryItem } from '@/app/logged/logged_components/modals/CategoriesModal';

interface ProductForm {
  productName: string;
  price: string;
  company: string;
  companyDisplayName: string;
  productDescription: string;
  mainImageSrc: string;
  productCategoriesArray: string[];
}

const initialForm: ProductForm = {
  productName: '',
  price: '',
  company: '',
  companyDisplayName: '',
  productDescription: '',
  mainImageSrc: '',
  productCategoriesArray: [],
};

function generateProductId(): string {
  const t = Date.now();
  const r = Math.random().toString(36).slice(2, 9);
  return `prod_${t}_${r}`;
}

const CreateProductInner: FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductForm, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyPortals, setCompanyPortals] = useState<{ portalId: number; portalName: string }[]>([]);
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const [companySelectOpen, setCompanySelectOpen] = useState(false);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [confirmRemoveCategory, setConfirmRemoveCategory] = useState<string | null>(null);

  useEffect(() => {
    const companyFromQuery = searchParams.get('company');
    if (companyFromQuery?.trim()) {
      setForm((prev) =>
        prev.company ? prev : { ...prev, company: companyFromQuery.trim(), companyDisplayName: companyFromQuery.trim() }
      );
    }
  }, [searchParams]);

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

  const update = (field: keyof ProductForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ProductForm]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof ProductForm, string>> = {};
    if (!form.productName.trim()) next.productName = 'Product name is required';
    if (!form.company.trim()) next.company = 'Company is required';
    if (form.price !== '') {
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
      const productCategoriesArray = form.productCategoriesArray ?? [];
      await ProductService.createProduct({
        productId,
        productName: form.productName.trim(),
        price: form.price.trim() ? parseFloat(form.price) : 0,
        company: form.company.trim(),
        productDescription: form.productDescription.trim(),
        mainImageSrc: form.mainImageSrc.trim(),
        productCategoriesArray,
        portalIds: selectedPortalIds,
      });
      router.push('/logged/pages/network/directory/products');
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

  const breadcrumbs = [
    { label: "Products", href: "/logged/pages/network/directory/products" },
    { label: "Create product" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Create Product", breadcrumbs, buttons: [{ label: "Back to Products", href: "/logged/pages/network/directory/products" }] });
  }, [setPageMeta, breadcrumbs]);

  useEffect(() => {
    if (!confirmRemoveCategory) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmRemoveCategory(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmRemoveCategory]);

  return (
    <>
      <PageContentSection className="w-full max-w-none">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
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
                  Price <span className="text-gray-400 font-normal">(optional)</span>
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
                  Belongs to company
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCompanySelectOpen(true)}
                    className={`w-full max-w-md px-4 py-2 border-2 border-dashed rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium text-left ${
                      errors.company ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    Select company from directory
                  </button>
                  {errors.company && (
                    <p className="text-sm text-red-500">{errors.company}</p>
                  )}
                  {form.company && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl">
                      <span className="text-sm font-mono text-gray-800">{form.company}</span>
                      {form.companyDisplayName && form.companyDisplayName !== form.company && (
                        <span className="text-sm text-gray-600">— {form.companyDisplayName}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, company: '', companyDisplayName: '' }))}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {form.company.trim() && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-500 uppercase mb-1">
                    Portals (only portals where this company is visible)
                  </label>
                  {companyPortals.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Company not found or has no portals. Select a company that is linked to at least one portal.
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
                  Main Image
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setMediatecaOpen(true)}
                    className="w-full max-w-md px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                  >
                    Select or add image
                  </button>
                  {form.mainImageSrc && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl">
                      <img
                        src={form.mainImageSrc}
                        alt="Main"
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-sm text-gray-600 truncate flex-1 min-w-0" title={form.mainImageSrc}>
                        {form.mainImageSrc}
                      </span>
                      <button
                        type="button"
                        onClick={() => update('mainImageSrc', '')}
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
                  Categories
                </label>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoriesModalOpen(true)}
                    className="w-full max-w-md px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                  >
                    Select categories
                  </button>
                  {(form.productCategoriesArray ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl">
                      {(form.productCategoriesArray ?? []).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-900 rounded-lg text-sm font-medium"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveCategory(name)}
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
              onClick={() => router.push('/logged/pages/network/directory/products')}
              className="px-6 py-2 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </PageContentSection>

      <CompanyDirectorySelectModal
        open={companySelectOpen}
        onClose={() => setCompanySelectOpen(false)}
        onSelectCompany={(companyId, commercialName) => {
          setForm((prev) => ({
            ...prev,
            company: companyId,
            companyDisplayName: commercialName ?? companyId,
          }));
          setCompanySelectOpen(false);
        }}
      />

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(src) => {
          update('mainImageSrc', src);
          setMediatecaOpen(false);
        }}
      />

      <CategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        selectedCategoryNames={form.productCategoriesArray ?? []}
        onSelectCategories={(categories: CategoryItem[]) => {
          update('productCategoriesArray', categories.map((c) => c.name));
          setCategoriesModalOpen(false);
        }}
      />

      {confirmRemoveCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-category-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="confirm-remove-category-title" className="text-lg font-semibold text-gray-900 mb-2">
              Remove category
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to remove the category &quot;{confirmRemoveCategory}&quot;?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemoveCategory(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    productCategoriesArray: (prev.productCategoriesArray ?? []).filter((n) => n !== confirmRemoveCategory),
                  }));
                  setConfirmRemoveCategory(null);
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Yes, remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const CreateProductPage: FC = () => (
  <Suspense
    fallback={
      <div className="flex flex-col w-full bg-white p-8">
        <p className="text-center text-gray-500">Loading…</p>
      </div>
    }
  >
    <CreateProductInner />
  </Suspense>
);

export default CreateProductPage;
