"use client";

import React, { FC, useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ProductCategoryService } from "@/app/service/ProductCategoryService";
import { ProductService } from "@/app/service/ProductService";
import { Product } from "@/app/contents/interfaces";

const ProductCategoryDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const id_category = params?.id_category as string | undefined;
  const [category, setCategory] = useState<{
    id_category: string;
    name: string;
    portals_array: string[];
  } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNameOrId, setFilterNameOrId] = useState("");

  useEffect(() => {
    if (!id_category) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [cat, allProducts] = await Promise.all([
          ProductCategoryService.getCategoryById(id_category),
          ProductService.getAllProducts(),
        ]);
        if (!cancelled) {
          setCategory(cat);
          const list = Array.isArray(allProducts) ? allProducts : [];
          const categoryNameLower = (cat?.name || "").trim().toLowerCase();
          setProducts(
            list.filter((p: Product) =>
              (p.productCategoriesArray || []).some(
                (c) => String(c).trim().toLowerCase() === categoryNameLower
              )
            )
          );
        }
      } catch {
        if (!cancelled) {
          setCategory(null);
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id_category]);

  const filteredProducts = useMemo(() => {
    if (!filterNameOrId.trim()) return products;
    const q = filterNameOrId.trim().toLowerCase();
    return products.filter(
      (p) =>
        (p.productId || "").toLowerCase().includes(q) ||
        (p.productName || "").toLowerCase().includes(q)
    );
  }, [products, filterNameOrId]);

  const breadcrumbs = [
    { label: "Products", href: "/logged/pages/network/directory/products" },
    {
      label: "Product Categories",
      href: "/logged/pages/network/directory/products/categories",
    },
    { label: category?.name ?? "Category" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: category ? `${category.name} – Product Category` : "Product Category",
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
        <p className="text-gray-500">Product category not found.</p>
        <Link
          href="/logged/pages/network/directory/products/categories"
          className="text-blue-600 hover:underline mt-2 inline-block"
        >
          Back to Product Categories
        </Link>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="mb-4">
          <Link
            href="/logged/pages/network/directory/products/categories"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Product Categories
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
          placeholder="Search by product name or ID"
          className="w-full max-w-md px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-950 mb-4"
        />

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-gray-500 text-sm"
                  >
                    No products in this category
                    {filterNameOrId.trim() ? " matching the filter" : ""}.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr
                    key={product.productId}
                    onClick={() =>
                      router.push(
                        `/logged/pages/network/directory/products/${product.productId}`
                      )
                    }
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.productId}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${Number(product.price).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.company}
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

export default ProductCategoryDetailPage;
