"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import CreateCompanyCategoryModal from "@/app/logged/logged_components/modals/CreateCompanyCategoryModal";

interface CompanyCategory {
  category_id: string;
  category_name: string;
  category_description?: string;
  portals_array: string[];
}

const CompanyCategoriesPage: FC = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<CompanyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const categoryHref = (id: string) =>
    `/logged/pages/network/directory/companies/categories/${id}`;

  const loadCategories = useCallback(async () => {
    try {
      const list = await CompanyCategoryService.getAllCategories();
      const raw = Array.isArray(list) ? list : [];
      setCategories(
        raw
          .filter((c) => c != null && typeof c === "object")
          .map((c) => {
            const row = c as CompanyCategory;
            return {
              category_id: String(row.category_id ?? ""),
              category_name: String(row.category_name ?? ""),
              category_description: row.category_description,
              portals_array: Array.isArray(row.portals_array) ? row.portals_array : [],
            };
          })
      );
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);
  const breadcrumbs = [
    { label: "Companies", href: "/logged/pages/network/directory/companies" },
    { label: "Company Categories" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Company Categories",
      breadcrumbs,
      buttons: [
        { label: "Create Category", onClick: () => setModalOpen(true) },
      ],
    });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-sm">Loading company categories…</p>
              ) : (
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
                  No company categories yet. Create one with the button above.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr
                  key={cat.category_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(categoryHref(cat.category_id))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(categoryHref(cat.category_id));
                    }
                  }}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {cat.category_name}
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
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
      <CreateCompanyCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existingNames={categories.map((c) => c.category_name)}
        onCreated={loadCategories}
      />
    </>
  );
};

export default CompanyCategoriesPage;
