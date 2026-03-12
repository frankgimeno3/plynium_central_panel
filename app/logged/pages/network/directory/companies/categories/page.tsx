"use client";

import React, { FC, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { CompanyCategoryService } from "@/app/service/CompanyCategoryService";
import CreateCompanyCategoryModal from "@/app/logged/logged_components/modals/CreateCompanyCategoryModal";

interface CompanyCategory {
  id_category: string;
  name: string;
  description?: string;
  portals_array: string[];
}

const CompanyCategoriesPage: FC = () => {
  const [categories, setCategories] = useState<CompanyCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const list = await CompanyCategoryService.getAllCategories();
      setCategories(Array.isArray(list) ? list : []);
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
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
      <CreateCompanyCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existingNames={categories.map((c) => c.name)}
        onCreated={loadCategories}
      />
    </>
  );
};

export default CompanyCategoriesPage;
