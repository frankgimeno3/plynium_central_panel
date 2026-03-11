"use client";

import React, { FC, useEffect } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import categoriesData from "@/app/contents/categoriescontents.json";

interface CompanyCategory {
  id_category: string;
  name: string;
  portals_array: string[];
}

const categories = (categoriesData as CompanyCategory[]).filter(
  (c) => c && typeof c.id_category === "string"
);

const CompanyCategoriesPage: FC = () => {
  const breadcrumbs = [
    { label: "Companies", href: "/logged/pages/network/directory/companies" },
    { label: "Company Categories" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Company Categories",
      breadcrumbs,
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <PageContentSection>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Portals
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-6 text-center text-gray-500 text-sm"
                >
                  No categories in categoriescontents.json.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id_category}>
                  <td className="px-4 py-3">
                    <Link
                      href={`/logged/pages/network/directory/companies/categories/${cat.id_category}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {cat.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {(cat.portals_array || []).join(", ") || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContentSection>
  );
};

export default CompanyCategoriesPage;
