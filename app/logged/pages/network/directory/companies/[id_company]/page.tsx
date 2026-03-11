"use client";

import React, { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { CompanyService } from '@/app/service/CompanyService';
import { PortalService } from '@/app/service/PortalService';
import { ProductService } from '@/app/service/ProductService';
import { Company } from '@/app/contents/interfaces';
import MediatecaModal from '@/app/logged/logged_components/modals/MediatecaModal';
import CategoriesModal from '@/app/logged/logged_components/modals/CategoriesModal';

/** Mock data for "Articles about this company" - replace with real API later */
const MOCK_ARTICLES_ABOUT_COMPANY = [
  { id_article: 'article_25_000000003', articleTitle: 'Company spotlight: GlassTech', articleSubtitle: 'An overview', article_main_image_url: '' },
  { id_article: 'article_25_000000004', articleTitle: 'Industry trends and this company', articleSubtitle: 'Market analysis', article_main_image_url: '' },
];

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
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [confirmUntagCategory, setConfirmUntagCategory] = useState<string | null>(null);
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<{ productId: string; productName: string } | null>(null);
  const [deleteProductLoading, setDeleteProductLoading] = useState(false);
  const { setPageMeta } = usePageContent();

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
          const form = { ...data };
          if (!Array.isArray(form.categoriesArray) || form.categoriesArray.length === 0) {
            if (data.category?.trim()) {
              form.categoriesArray = [data.category.trim()];
            } else {
              form.categoriesArray = [];
            }
          }
          setFormData(form);
          setInitialData({ ...form });
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

  useEffect(() => {
    if (company && formData) {
      const titleName = formData.commercialName?.trim() || companyId || "Company";
      setPageMeta({
        pageTitle: `Company Details: ${titleName}`,
        breadcrumbs: [
          { label: "Companies", href: "/logged/pages/network/directory/companies" },
          { label: formData.commercialName ?? companyId ?? "Company" },
        ],
        buttons: [{ label: "Back to Companies", href: "/logged/pages/network/directory/companies" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Company Details",
        breadcrumbs: [
          { label: "Companies", href: "/logged/pages/network/directory/companies" },
        ],
        buttons: [{ label: "Back to Companies", href: "/logged/pages/network/directory/companies" }],
      });
    }
  }, [setPageMeta, company, formData, companyId]);

  useEffect(() => {
    if (!deleteProductConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDeleteProductConfirm(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteProductConfirm]);

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
      const categoriesArray = formData.categoriesArray ?? [];
      await CompanyService.updateCompany(companyId, {
        commercialName: formData.commercialName,
        country: formData.country,
        category: categoriesArray[0] ?? formData.category ?? '',
        mainDescription: formData.mainDescription,
        mainImage: formData.mainImage,
        productsArray: formData.productsArray ?? [],
        categoriesArray,
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

  const breadcrumbs = [
    { label: "Companies", href: "/logged/pages/network/directory/companies" },
    { label: formData?.commercialName ?? companyId ?? "Company" },
  ];

  const productsCreateHref = `/logged/pages/network/directory/products/create?company=${encodeURIComponent(companyId)}`;

  return (
    <>
      <PageContentSection>
        <div className="p-0">
          {/* Main image at top - large, with Search or Add overlay bottom-right */}
          <div className="relative w-full mb-8 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {formData.mainImage ? (
              <img
                src={formData.mainImage}
                alt={formData.commercialName || 'Company'}
                className="w-full max-h-[420px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-64 flex items-center justify-center text-gray-400 ${formData.mainImage ? 'hidden' : ''}`}>
              No image
            </div>
            <div className="absolute bottom-3 right-3 rounded-xl shadow-lg bg-white/80 p-3 flex flex-col gap-2 min-w-[200px]">
              <span className="text-xs font-semibold text-gray-700">Main Image</span>
              <button
                type="button"
                onClick={() => setMediatecaOpen(true)}
                className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm"
              >
                Update image
              </button>
              {formData.mainImage && (
                <div className="flex items-center gap-2">
                  <img
                    src={formData.mainImage}
                    alt=""
                    className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange('mainImage', '')}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Commercial Name
              </label>
              <input
                type="text"
                value={formData.commercialName}
                onChange={(e) => handleInputChange('commercialName', e.target.value)}
                placeholder="e.g. GlassTech Solutions"
                className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-blue-950 bg-white"
              />
            </div>

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
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                {(formData.categoriesArray ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl">
                    {(formData.categoriesArray ?? []).map((name) => (
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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Products (linked to this company)
                </label>
                <Link
                  href={productsCreateHref}
                  className="px-4 py-2 rounded-lg bg-blue-950 text-white text-sm font-medium hover:bg-blue-900 transition-colors"
                >
                  Add products to this company
                </Link>
              </div>
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
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-300" style={{ width: 100 }}>
                          Delete product
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {companyProducts.map((prod) => (
                        <tr
                          key={prod.productId}
                          onClick={() => router.push(`/logged/pages/network/directory/products/${encodeURIComponent(prod.productId)}`)}
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
                          <td className="px-4 py-3 border-b border-gray-200 align-middle" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setDeleteProductConfirm({ productId: prod.productId, productName: prod.productName })}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Articles about this company
        </h2>
        <div className="flex flex-row flex-wrap gap-4">
          {MOCK_ARTICLES_ABOUT_COMPANY.map((article) => (
            <Link
              key={article.id_article}
              href={`/logged/pages/network/contents/articles/${encodeURIComponent(article.id_article)}`}
              className="flex flex-col w-40 rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white hover:border-blue-950/50 hover:shadow transition-colors"
            >
              <div className="w-full aspect-[4/3] bg-gray-100 flex items-center justify-center overflow-hidden">
                {article.article_main_image_url ? (
                  <img
                    src={article.article_main_image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <span
                  className={`text-gray-400 text-xs ${article.article_main_image_url ? 'hidden' : ''}`}
                  aria-hidden
                >
                  No image
                </span>
              </div>
              <div className="p-3 flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-gray-900 text-sm truncate" title={article.articleTitle}>
                  {article.articleTitle}
                </span>
                {article.articleSubtitle ? (
                  <span className="text-xs text-gray-500 truncate" title={article.articleSubtitle}>
                    {article.articleSubtitle}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      </PageContentSection>

      <CategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        selectedCategoryNames={formData.categoriesArray ?? []}
        onSelectCategories={(categories) => {
          handleInputChange('categoriesArray', categories.map((c) => c.name));
          setCategoriesModalOpen(false);
        }}
      />
      {confirmUntagCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="detail-untag-confirm-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="detail-untag-confirm-title" className="text-lg font-semibold text-gray-900 mb-2">
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
                  const next = (formData.categoriesArray ?? []).filter((n) => n !== confirmUntagCategory);
                  handleInputChange('categoriesArray', next);
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
      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={(imageUrl) => {
          handleInputChange('mainImage', imageUrl);
          setMediatecaOpen(false);
        }}
      />

      {deleteProductConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-product-confirm-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 id="delete-product-confirm-title" className="text-lg font-semibold text-gray-900">
                Delete product
              </h3>
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                disabled={deleteProductLoading}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none disabled:opacity-50"
                aria-label="Cancel"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete?
            </p>
            {deleteProductConfirm.productName && (
              <p className="text-sm text-gray-500 mb-4">
                Product: {deleteProductConfirm.productName}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteProductConfirm(null)}
                disabled={deleteProductLoading}
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deleteProductConfirm) return;
                  setDeleteProductLoading(true);
                  try {
                    await ProductService.deleteProduct(deleteProductConfirm.productId);
                    setCompanyProducts((prev) => prev.filter((p) => p.productId !== deleteProductConfirm.productId));
                    setDeleteProductConfirm(null);
                  } catch (e: unknown) {
                    const msg = (e as { message?: string })?.message ?? (e as { data?: { message?: string } })?.data?.message ?? 'Failed to delete product';
                    alert(msg);
                  } finally {
                    setDeleteProductLoading(false);
                  }
                }}
                disabled={deleteProductLoading}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleteProductLoading ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="fixed bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:font-bold transition-all z-50 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      )}
    </>
  );
};

export default IdCompany;
