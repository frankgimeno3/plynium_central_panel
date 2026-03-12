"use client";

import React, { FC, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CompanyService } from "@/app/service/CompanyService";
import { Company } from "@/app/contents/interfaces";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import { CustomerService } from "@/app/service/CustomerService";

interface CompanyCategory {
  id_category: string;
  name: string;
  description?: string;
  portals_array: string[];
}

type CustomerRow = {
  id_customer: string;
  name: string;
  country?: string;
  email?: string;
  company_categories_array?: string[];
};

type TabKey = "companies" | "customers";

function ConfirmUnlinkModal({
  open,
  onClose,
  onConfirm,
  title,
  itemLabel,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemLabel: string;
  loading: boolean;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">
          Are you sure you want to unlink &quot;{itemLabel}&quot; from this category? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Unlinking…" : "Unlink"}
          </button>
        </div>
      </div>
    </div>
  );
}

const CategoryDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const id_category = params?.id_category as string | undefined;
  const [category, setCategory] = useState<CompanyCategory | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("companies");
  const [filterNameOrId, setFilterNameOrId] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unlinkModal, setUnlinkModal] = useState<{
    type: "company" | "customer";
    id: string;
    label: string;
  } | null>(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const fetchCategory = useCallback(async () => {
    if (!id_category) return;
    setCategoryLoading(true);
    try {
      const data = await CompanyCategoryService.getCategoryById(id_category);
      setCategory(data);
    } catch {
      setCategory(null);
    } finally {
      setCategoryLoading(false);
    }
  }, [id_category]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  useEffect(() => {
    if (!id_category || !category) return;
    let cancelled = false;
    (async () => {
      setLoadingCompanies(true);
      try {
        const allCompanies = await CompanyService.getAllCompanies();
        if (cancelled || !category) return;
        const list = Array.isArray(allCompanies) ? allCompanies : [];
        const nameMatch = (category.name || "").trim().toLowerCase();
        setCompanies(
          list.filter((c: Company) => {
            const mainMatch = (c.category || "").trim().toLowerCase() === nameMatch;
            const inArray = (c.categoriesArray || []).some(
              (id) => String(id).toLowerCase() === String(id_category).toLowerCase()
            );
            return mainMatch || inArray;
          })
        );
      } catch {
        if (!cancelled) setCompanies([]);
      } finally {
        if (!cancelled) setLoadingCompanies(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id_category, category]);

  useEffect(() => {
    if (!id_category) return;
    let cancelled = false;
    (async () => {
      setLoadingCustomers(true);
      try {
        const list = await CustomerService.getAllCustomers();
        if (cancelled) return;
        const arr = Array.isArray(list) ? list : [];
        setCustomers(
          arr.filter((c: CustomerRow) =>
            (c.company_categories_array || []).includes(id_category)
          )
        );
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setLoadingCustomers(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id_category]);

  const filteredCompanies = useMemo(() => {
    if (!filterNameOrId.trim()) return companies;
    const q = filterNameOrId.trim().toLowerCase();
    return companies.filter(
      (c) =>
        (c.companyId || "").toLowerCase().includes(q) ||
        (c.commercialName || "").toLowerCase().includes(q)
    );
  }, [companies, filterNameOrId]);

  const filteredCustomers = useMemo(() => {
    if (!filterCustomer.trim()) return customers;
    const q = filterCustomer.trim().toLowerCase();
    return customers.filter(
      (c) =>
        (c.id_customer || "").toLowerCase().includes(q) ||
        (c.name || "").toLowerCase().includes(q)
    );
  }, [customers, filterCustomer]);

  const handleDeleteCategory = async () => {
    if (!id_category) return;
    setDeleteLoading(true);
    try {
      await CompanyCategoryService.deleteCategory(id_category);
      router.push("/logged/pages/network/directory/companies/categories");
      router.refresh();
    } catch {
      setDeleteLoading(false);
    }
  };

  const handleUnlinkCompany = async () => {
    if (!unlinkModal || unlinkModal.type !== "company" || !category) return;
    const company = companies.find((c) => c.companyId === unlinkModal.id);
    if (!company) return;
    setUnlinkLoading(true);
    try {
      const nameMatch = (category.name || "").trim().toLowerCase() === (company.category || "").trim().toLowerCase();
      const newCategoriesArray = (company.categoriesArray || []).filter(
        (id) => String(id) !== String(id_category)
      );
      await CompanyService.updateCompany(unlinkModal.id, {
        category: nameMatch ? "" : company.category,
        categoriesArray: newCategoriesArray,
      });
      setCompanies((prev) => prev.filter((c) => c.companyId !== unlinkModal.id));
      setUnlinkModal(null);
    } catch {
      // keep modal open on error
    } finally {
      setUnlinkLoading(false);
    }
  };

  const handleUnlinkCustomer = async () => {
    if (!unlinkModal || unlinkModal.type !== "customer") return;
    const customer = customers.find((c) => c.id_customer === unlinkModal.id);
    if (!customer) return;
    setUnlinkLoading(true);
    try {
      const newArr = (customer.company_categories_array || []).filter(
        (id) => String(id) !== String(id_category)
      );
      await CustomerService.updateCustomer(unlinkModal.id, {
        company_categories_array: newArr,
      });
      setCustomers((prev) => prev.filter((c) => c.id_customer !== unlinkModal.id));
      setUnlinkModal(null);
    } catch {
      // keep modal open on error
    } finally {
      setUnlinkLoading(false);
    }
  };

  const breadcrumbs = [
    { label: "Companies", href: "/logged/pages/network/directory/companies" },
    {
      label: "Company Categories",
      href: "/logged/pages/network/directory/companies/categories",
    },
    { label: category?.name ?? "Category" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: category ? `${category.name} – Category` : "Category",
      breadcrumbs,
    });
  }, [setPageMeta, category?.name]);

  if (categoryLoading && !category) {
    return (
      <PageContentSection>
        <p className="text-gray-500 text-sm">Loading…</p>
      </PageContentSection>
    );
  }

  if (!category) {
    return (
      <PageContentSection>
        <p className="text-gray-500">Category not found.</p>
        <Link
          href="/logged/pages/network/directory/companies/categories"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Back to Company Categories
        </Link>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Link
            href="/logged/pages/network/directory/companies/categories"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Company Categories
          </Link>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="text-sm px-3 py-1.5 rounded-lg border border-red-600 text-red-600 hover:bg-red-50"
          >
            Delete category
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
        {category.description && (
          <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{category.description}</p>
        )}
        <div className="text-sm text-gray-600">
          <span className="font-medium">Portals: </span>
          {(category.portals_array || []).length > 0
            ? category.portals_array.join(", ")
            : "—"}
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("companies")}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "companies"
                ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Related Companies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "customers"
                ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Related Customers
          </button>
        </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        {activeTab === "companies" && (
          <>
            <p className="text-sm font-semibold mb-2 text-gray-700">
              Published Companies related to this category
            </p>
            <input
              type="text"
              value={filterNameOrId}
              onChange={(e) => setFilterNameOrId(e.target.value)}
              placeholder="Search by company name or ID"
              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 mb-4"
            />
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Commercial Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingCompanies ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                        No companies in this category
                        {filterNameOrId.trim() ? " matching the filter" : ""}.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => (
                      <tr
                        key={company.companyId}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/logged/pages/network/directory/companies/${company.companyId}`
                              )
                            }
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {company.companyId}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {company.commercialName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {company.country}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {company.mainEmail}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUnlinkModal({
                                type: "company",
                                id: company.companyId,
                                label: company.commercialName || company.companyId,
                              });
                            }}
                            className="text-red-600 hover:underline font-medium"
                          >
                            Unlink
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "customers" && (
          <>
            <p className="text-sm font-semibold mb-2 text-gray-700">
              Customers related to this category
            </p>
            <input
              type="text"
              value={filterCustomer}
              onChange={(e) => setFilterCustomer(e.target.value)}
              placeholder="Search by customer name or ID"
              className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 mb-4"
            />
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Country
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingCustomers ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                        Loading…
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-gray-500 text-sm">
                        No customers in this category
                        {filterCustomer.trim() ? " matching the filter" : ""}.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr key={cust.id_customer} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/logged/pages/account-management/customers_db/${encodeURIComponent(cust.id_customer)}`
                              )
                            }
                            className="text-blue-600 hover:underline font-medium"
                          >
                            {cust.id_customer}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {cust.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cust.country ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cust.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            type="button"
                            onClick={() =>
                              setUnlinkModal({
                                type: "customer",
                                id: cust.id_customer,
                                label: cust.name || cust.id_customer,
                              })
                            }
                            className="text-red-600 hover:underline font-medium"
                          >
                            Unlink
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>

      {/* Delete category confirm - reuse modal with different copy */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete category</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete &quot;{category.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => !deleteLoading && setDeleteModalOpen(false)} disabled={deleteLoading} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleDeleteCategory} disabled={deleteLoading} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{deleteLoading ? "Deleting…" : "Delete"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Unlink company/customer confirm */}
      {unlinkModal && (
        <ConfirmUnlinkModal
          open={!!unlinkModal}
          onClose={() => !unlinkLoading && setUnlinkModal(null)}
          onConfirm={unlinkModal.type === "company" ? handleUnlinkCompany : handleUnlinkCustomer}
          title="Unlink from category"
          itemLabel={unlinkModal.label}
          loading={unlinkLoading}
        />
      )}
    </>
  );
};

export default CategoryDetailPage;
