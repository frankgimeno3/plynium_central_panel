"use client";

import React, { FC, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ProductCategoryService } from "@/app/service/ProductCategoryService";
import { PortalService } from "@/app/service/PortalService";

interface ProductCategory {
  id_category: string;
  name: string;
  portals_array: string[];
}

const CreateCategoryModal: FC<{
  open: boolean;
  onClose: () => void;
  existingNames: string[];
  onCreated: () => void;
}> = ({ open, onClose, existingNames, onCreated }) => {
  const [name, setName] = useState("");
  const [selectedPortals, setSelectedPortals] = useState<string[]>([]);
  const [portals, setPortals] = useState<{ id: number; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const nameTrimmed = name.trim();
  const nameExists = existingNames.some(
    (n) => n.toLowerCase() === nameTrimmed.toLowerCase()
  );
  const canConfirm =
    nameTrimmed.length > 0 &&
    !nameExists &&
    selectedPortals.length > 0 &&
    !submitting;

  useEffect(() => {
    PortalService.getAllPortals()
      .then((list: any[]) => {
        setPortals(
          Array.isArray(list)
            ? list.map((p) => ({ id: p.id, name: p.name ?? String(p.key ?? p.id) }))
            : []
        );
      })
      .catch(() => setPortals([]));
  }, [open]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setError("");
    setSubmitting(true);
    try {
      await ProductCategoryService.createCategory({
        name: nameTrimmed,
        portals_array: selectedPortals,
      });
      setName("");
      setSelectedPortals([]);
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create product category");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePortal = (portalName: string) => {
    setSelectedPortals((prev) =>
      prev.includes(portalName)
        ? prev.filter((p) => p !== portalName)
        : [...prev, portalName]
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Create product category</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product category name"
              className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {nameTrimmed && nameExists && (
              <p className="mt-1 text-xs text-red-600">This name already exists</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portals (required)
            </label>
            <div className="flex flex-wrap gap-2">
              {portals.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={selectedPortals.includes(p.name)}
                    onChange={() => togglePortal(p.name)}
                    className="rounded border-gray-300"
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            {selectedPortals.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">Select at least one portal</p>
            )}
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="px-4 py-2 text-sm rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCategoriesPage: FC = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const list = await ProductCategoryService.getAllCategories();
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
    { label: "Products", href: "/logged/pages/network/directory/products" },
    { label: "Product Categories" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Product Categories",
      breadcrumbs,
      buttons: [
        {
          label: "Create category",
          onClick: () => setModalOpen(true),
        },
      ],
    });
  }, [setPageMeta]);

  const existingNames = categories.map((c) => c.name);

  return (
    <>
      <PageContentSection>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading product categories…</p>
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
                    <td colSpan={2} className="px-4 py-6 text-center text-gray-500 text-sm">
                      No product categories yet. Create one with the button above.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id_category}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/logged/pages/network/directory/products/categories/${cat.id_category}`}
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
      </PageContentSection>

      <CreateCategoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        existingNames={existingNames}
        onCreated={loadCategories}
      />
    </>
  );
};

export default ProductCategoriesPage;
