"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import { CompanyService } from "@/app/service/CompanyService";
import { Company } from "@/app/contents/interfaces";

const CategoryDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const id_category = params?.id_category as string | undefined;
  const [category, setCategory] = useState<{
    id_category: string;
    name: string;
    portals_array: string[];
  } | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNameOrId, setFilterNameOrId] = useState("");

  useEffect(() => {
    if (!id_category) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cat, allCompanies] = await Promise.all([
          CompanyCategoryService.getCategoryById(id_category),
          CompanyService.getAllCompanies(),
        ]);
        if (!cancelled) {
          setCategory(cat);
          const list = Array.isArray(allCompanies) ? allCompanies : [];
          setCompanies(
            list.filter(
              (c: Company) =>
                (c.category || "").trim().toLowerCase() ===
                (cat?.name || "").trim().toLowerCase()
            )
          );
        }
      } catch {
        if (!cancelled) {
          setCategory(null);
          setCompanies([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
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

  if (loading && !category) {
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
        <div className="mb-4">
          <Link
            href="/logged/pages/network/directory/companies/categories"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Company Categories
          </Link>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h2>
        <div className="text-sm text-gray-600">
          <span className="font-medium">Portals: </span>
          {(category.portals_array || []).length > 0
            ? category.portals_array.join(", ")
            : "—"}
        </div>
      </PageContentSection>

      <PageContentSection>
        <p className="text-sm font-semibold mb-2 text-gray-700">Filter by name or ID</p>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                  >
                    No companies in this category
                    {filterNameOrId.trim() ? " matching the filter" : ""}.
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr
                    key={company.companyId}
                    onClick={() =>
                      router.push(
                        `/logged/pages/network/directory/companies/${company.companyId}`
                      )
                    }
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {company.companyId}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </PageContentSection>
    </>
  );
};

export default CategoryDetailPage;
