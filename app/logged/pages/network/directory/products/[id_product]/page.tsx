"use client";

import React, { FC, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ProductService } from "@/app/service/ProductService";
import { CompanyService } from "@/app/service/CompanyService";
import { Product } from "@/app/contents/interfaces";
import MediatecaModal from "@/app/logged/logged_components/modals/MediatecaModal";
import CategoriesModal from "@/app/logged/logged_components/modals/CategoriesModal";
import type { CategoryItem } from "@/app/logged/logged_components/modals/CategoriesModal";

const MAX_EXTRA_IMAGES = 3;

export interface ExtraProductImage {
  imageSrc: string;
  imageTitle: string;
  imageDescription: string;
}

interface IdProductProps {}

const IdProduct: FC<IdProductProps> = ({}) => {
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
  const [companyData, setCompanyData] = useState<{
    commercialName: string;
  } | null>(null);
  const [mediatecaOpen, setMediatecaOpen] = useState(false);
  const [mediatecaTarget, setMediatecaTarget] = useState<
    "main" | number
  >("main");
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [confirmRemoveCategory, setConfirmRemoveCategory] = useState<
    string | null
  >(null);
  const [extraImages, setExtraImages] = useState<ExtraProductImage[]>([]);
  const [initialExtraImages, setInitialExtraImages] = useState<
    ExtraProductImage[]
  >([]);
  const [productWebLinks, setProductWebLinks] = useState("");
  const [initialProductWebLinks, setInitialProductWebLinks] = useState("");
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await ProductService.getProductById(productId);
        if (!cancelled) {
          setProduct(data);
          setFormData({ ...data });
          setInitialData({ ...data });
          const raw = data as Product & { extraProductImages?: ExtraProductImage[] };
          const extras = Array.isArray(raw?.extraProductImages)
            ? raw.extraProductImages.slice(0, MAX_EXTRA_IMAGES)
            : [];
          setExtraImages(extras);
          setInitialExtraImages(extras);
          const rawData = data as Product & { productWebLinks?: string };
          const webLinks = rawData?.productWebLinks ?? "";
          setProductWebLinks(webLinks);
          setInitialProductWebLinks(webLinks);
        }
        const companyId = data?.company?.trim();
        const [productPortalsList, companyPortalsList] = await Promise.all([
          ProductService.getProductPortals(productId).catch(() => []),
          companyId
            ? CompanyService.getCompanyPortals(companyId).catch(() => [])
            : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setProductPortals(
            Array.isArray(productPortalsList) ? productPortalsList : []
          );
          setCompanyPortals(
            Array.isArray(companyPortalsList) ? companyPortalsList : []
          );
          if (companyId) {
            CompanyService.getCompanyById(companyId)
              .then((c: { commercialName?: string }) =>
                setCompanyData(
                  c ? { commercialName: c.commercialName ?? companyId } : null
                )
              )
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
    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
    if (!formData?.company?.trim()) {
      setCompanyPortals([]);
      return;
    }
    CompanyService.getCompanyPortals(formData.company.trim())
      .then((list: { portalId: number; portalName: string }[]) =>
        setCompanyPortals(Array.isArray(list) ? list : [])
      )
      .catch(() => setCompanyPortals([]));
  }, [formData?.company]);

  useEffect(() => {
    if (product && formData) {
      const titleName =
        formData.productName?.trim() || productId || "Product";
      setPageMeta({
        pageTitle: `Product Details: ${titleName}`,
        breadcrumbs: [
          { label: "Products", href: "/logged/pages/network/directory/products" },
          { label: formData.productName ?? productId ?? "Product" },
        ],
        buttons: [
          { label: "Back to Products", href: "/logged/pages/network/directory/products" },
        ],
      });
    } else {
      setPageMeta({
        pageTitle: "Product Details",
        breadcrumbs: [
          { label: "Products", href: "/logged/pages/network/directory/products" },
        ],
        buttons: [
          { label: "Back to Products", href: "/logged/pages/network/directory/products" },
        ],
      });
    }
  }, [setPageMeta, product, formData, productId]);

  useEffect(() => {
    if (!confirmRemoveCategory) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirmRemoveCategory(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmRemoveCategory]);

  const handleInputChange = (
    field: keyof Product,
    value: string | number | string[]
  ) => {
    if (!formData) return;
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    const hasChanged =
      JSON.stringify(newFormData) !== JSON.stringify(initialData) ||
      JSON.stringify(extraImages) !== JSON.stringify(initialExtraImages) ||
      productWebLinks !== initialProductWebLinks;
    setHasChanges(hasChanged);
  };

  const handleExtraImageChange = (
    index: number,
    field: keyof ExtraProductImage,
    value: string
  ) => {
    setExtraImages((prev) => {
      const next = [...prev];
      if (!next[index]) return next;
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setHasChanges(true);
  };

  const addExtraImage = () => {
    if (extraImages.length >= MAX_EXTRA_IMAGES) return;
    setExtraImages((prev) => [
      ...prev,
      { imageSrc: "", imageTitle: "", imageDescription: "" },
    ]);
    setHasChanges(true);
  };

  const removeExtraImage = (index: number) => {
    setExtraImages((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const openMediatecaForMain = () => {
    setMediatecaTarget("main");
    setMediatecaOpen(true);
  };

  const openMediatecaForExtra = (index: number) => {
    setMediatecaTarget(index);
    setMediatecaOpen(true);
  };

  const handleMediatecaSelect = (imageUrl: string) => {
    if (mediatecaTarget === "main" && formData) {
      handleInputChange("mainImageSrc", imageUrl);
    } else if (typeof mediatecaTarget === "number") {
      setExtraImages((prev) => {
        const next = [...prev];
        if (next[mediatecaTarget]) {
          next[mediatecaTarget] = {
            ...next[mediatecaTarget],
            imageSrc: imageUrl,
          };
        }
        return next;
      });
      setHasChanges(true);
    }
    setMediatecaOpen(false);
  };

  const handleSave = async () => {
    if (!formData || !initialData) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        productName: formData.productName,
        price: formData.price,
        productDescription: formData.productDescription,
        mainImageSrc: formData.mainImageSrc,
        productCategoriesArray: formData.productCategoriesArray ?? [],
        productWebLinks: productWebLinks.trim() || undefined,
      };
      if (extraImages.length > 0) {
        (payload as { extraProductImages?: ExtraProductImage[] }).extraProductImages =
          extraImages;
      }
      await ProductService.updateProduct(productId, payload);
      setInitialData({ ...formData });
      setInitialExtraImages([...extraImages]);
      setInitialProductWebLinks(productWebLinks);
      setHasChanges(false);
    } catch (error: unknown) {
      const msg =
        typeof error === "string"
          ? error
          : (error as { message?: string })?.message ||
            (error as { data?: { message?: string } })?.data?.message ||
            "Failed to save";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (
      !productId ||
      !confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    )
      return;
    setDeleting(true);
    try {
      await ProductService.deleteProduct(productId);
      const companyId = formData?.company?.trim();
      if (companyId) {
        router.push(
          `/logged/pages/network/directory/companies/${encodeURIComponent(companyId)}`
        );
      } else {
        router.push("/logged/pages/network/directory/products");
      }
    } catch (error: unknown) {
      const msg =
        typeof error === "string"
          ? error
          : (error as { message?: string })?.message ||
            (error as { data?: { message?: string } })?.data?.message ||
            "Failed to delete product";
      alert(msg);
    } finally {
      setDeleting(false);
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

  const categoriesArray = formData.productCategoriesArray ?? [];

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
          {/* Main image at top - same structure as company page */}
          <div className="relative w-full mb-8 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {formData.mainImageSrc ? (
              <img
                src={formData.mainImageSrc}
                alt={formData.productName || "Product"}
                className="w-full max-h-[420px] object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove(
                    "hidden"
                  );
                }}
              />
            ) : null}
            <div
              className={`w-full h-64 flex items-center justify-center text-gray-400 ${
                formData.mainImageSrc ? "hidden" : ""
              }`}
            >
              No image
            </div>
            <div className="absolute bottom-3 right-3 rounded-xl shadow-lg bg-white/80 p-3 flex flex-col gap-2 min-w-[200px]">
              <span className="text-xs font-semibold text-gray-700">
                Main Image
              </span>
              <button
                type="button"
                onClick={openMediatecaForMain}
                className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/50 transition-colors font-medium text-sm"
              >
                Update image
              </button>
              {formData.mainImageSrc && (
                <div className="flex items-center gap-2">
                  <img
                    src={formData.mainImageSrc}
                    alt=""
                    className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange("mainImageSrc", "")}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product name - big input at top like Commercial Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product Name
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange("productName", e.target.value)}
                placeholder="e.g. Energy Efficient Double Pane Window"
                className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-950 focus:border-blue-950 bg-white"
              />
            </div>

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
                Price
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange("price", parseFloat(e.target.value) || 0)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                min="0"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Company (read-only)
              </label>
              {formData.company?.trim() ? (
                <Link
                  href={`/logged/pages/network/directory/companies/${encodeURIComponent(formData.company)}`}
                  className="flex flex-col gap-1 p-4 rounded-xl border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-blue-950/30 transition-colors"
                >
                  <span className="text-xl font-bold text-gray-900">
                    {companyData?.commercialName ?? formData.company}
                  </span>
                  <span className="text-sm text-gray-600">
                    {formData.company}
                  </span>
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
                onChange={(e) =>
                  handleInputChange("productDescription", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
                rows={4}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Product web links
              </label>
              <input
                type="url"
                value={productWebLinks}
                onChange={(e) => {
                  setProductWebLinks(e.target.value);
                  setHasChanges(
                    JSON.stringify(formData) !== JSON.stringify(initialData) ||
                      JSON.stringify(extraImages) !==
                        JSON.stringify(initialExtraImages) ||
                      e.target.value !== initialProductWebLinks
                  );
                }}
                placeholder="https://..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950"
              />
            </div>

            {/* Visible in portals - left-aligned block */}
            {formData.company?.trim() ? (
              <div className="md:col-span-2 flex flex-col items-start gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Visible in portals
                </label>
                <div className="flex flex-col gap-2 w-full max-w-2xl">
                  {companyPortals.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      Company has no portals. Add the company to portals first
                      from the company edit page.
                    </p>
                  ) : productPortals.length === 0 ? (
                    <p className="text-sm text-gray-500">Not visible in any portal yet.</p>
                  ) : (
                    <ul className="list-none flex flex-wrap gap-2">
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
                                const list =
                                  await ProductService.removeProductFromPortal(
                                    productId,
                                    pp.portalId
                                  );
                                setProductPortals(
                                  Array.isArray(list) ? list : []
                                );
                              } catch (e: unknown) {
                                const err = e as {
                                  message?: string;
                                  data?: { message?: string };
                                };
                                alert(
                                  err?.message ||
                                    err?.data?.message ||
                                    "Error removing from portal"
                                );
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
                  {companyPortals.filter(
                    (p) =>
                      !productPortals.some((pp) => pp.portalId === p.portalId)
                  ).length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        id="add-product-portal-select"
                        disabled={portalActionLoading}
                        className="px-3 py-2 border rounded-xl bg-white text-gray-700 text-sm disabled:opacity-50 max-w-xs"
                        defaultValue=""
                      >
                        <option value="">Select portal to add…</option>
                        {companyPortals
                          .filter(
                            (p) =>
                              !productPortals.some(
                                (pp) => pp.portalId === p.portalId
                              )
                          )
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
                          const sel = document.getElementById(
                            "add-product-portal-select"
                          ) as HTMLSelectElement;
                          const portalId = sel?.value
                            ? Number(sel.value)
                            : 0;
                          if (portalId && productId) {
                            setPortalActionLoading(true);
                            try {
                              const list =
                                await ProductService.addProductToPortal(
                                  productId,
                                  portalId
                                );
                              setProductPortals(
                                Array.isArray(list) ? list : []
                              );
                              if (sel) sel.value = "";
                            } catch (e: unknown) {
                              const err = e as {
                                message?: string;
                                data?: { message?: string };
                              };
                              alert(
                                err?.message ||
                                  err?.data?.message ||
                                  "Error adding to portal"
                              );
                            } finally {
                              setPortalActionLoading(false);
                            }
                          }
                        }}
                        className="px-3 py-2 text-xs rounded-xl bg-blue-950 text-white hover:bg-blue-950/90 disabled:opacity-50"
                      >
                        {portalActionLoading ? "…" : "Add to portal"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="md:col-span-2 flex flex-col items-start gap-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Visible in portals
                </label>
                <p className="text-sm text-gray-500">
                  Assign a company to manage portal visibility.
                </p>
              </div>
            )}

            {/* Tags (categories) - title + tags in row */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tags (categories)
              </label>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setCategoriesModalOpen(true)}
                  className="w-full max-w-md px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                >
                  Select categories
                </button>
                {categoriesArray.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 max-w-2xl">
                    {categoriesArray.map((name) => (
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

            {/* More product images - max 3 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                More product images
              </label>
              {extraImages.length < MAX_EXTRA_IMAGES && (
                <button
                  type="button"
                  onClick={addExtraImage}
                  className="mb-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-blue-950 hover:bg-blue-50/30 transition-colors font-medium"
                >
                  Add an extra image
                </button>
              )}
              <div className="flex flex-row flex-wrap gap-4">
                {extraImages.map((item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 flex flex-row gap-4 min-w-0 flex-1 max-w-full"
                  >
                    <div className="relative w-40 h-40 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow flex items-center justify-center">
                      {item.imageSrc ? (
                        <img
                          src={item.imageSrc}
                          alt={item.imageTitle || "Extra"}
                          className="absolute inset-0 w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).nextElementSibling?.classList.remove("hidden");
                          }}
                        />
                      ) : null}
                      <span
                        className={`text-gray-400 text-sm ${
                          item.imageSrc ? "hidden" : ""
                        }`}
                        aria-hidden
                      >
                        No image
                      </span>
                      <div className="absolute bottom-2 left-2 right-2 flex justify-center">
                        <button
                          type="button"
                          onClick={() => openMediatecaForExtra(index)}
                          className="px-3 py-2 bg-white/95 rounded-lg text-sm font-medium text-gray-800 shadow border border-gray-200 hover:bg-gray-50"
                        >
                          Update Image
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 flex-1 min-w-0">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Image title
                        </label>
                        <input
                          type="text"
                          value={item.imageTitle}
                          onChange={(e) =>
                            handleExtraImageChange(
                              index,
                              "imageTitle",
                              e.target.value
                            )
                          }
                          placeholder="Title"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Image description
                        </label>
                        <textarea
                          value={item.imageDescription}
                          onChange={(e) =>
                            handleExtraImageChange(
                              index,
                              "imageDescription",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-950 focus:border-blue-950 text-sm resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExtraImage(index)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium self-start"
                      >
                        Remove this image
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Articles about this product
              </h2>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <p className="text-gray-600 text-sm">
                  No related articles yet.
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  This section will be populated once the related-articles API is connected.
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <MediatecaModal
        open={mediatecaOpen}
        onClose={() => setMediatecaOpen(false)}
        onSelectImage={handleMediatecaSelect}
      />

      <CategoriesModal
        open={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        selectedCategoryNames={categoriesArray}
        onSelectCategories={(categories: CategoryItem[]) => {
          handleInputChange(
            "productCategoriesArray",
            categories.map((c) => c.name)
          );
          setCategoriesModalOpen(false);
        }}
      />

      {confirmRemoveCategory && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-remove-category-product-title"
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="confirm-remove-category-product-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
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
                  handleInputChange(
                    "productCategoriesArray",
                    categoriesArray.filter((c) => c !== confirmRemoveCategory)
                  );
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

      <div className="fixed bottom-6 right-6 flex items-center gap-3 z-50">
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:font-bold transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="bg-gray-700 text-white px-6 py-3 rounded-lg shadow-lg cursor-pointer hover:bg-gray-800 transition-all disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete product"}
        </button>
      </div>
    </>
  );
};

export default IdProduct;
