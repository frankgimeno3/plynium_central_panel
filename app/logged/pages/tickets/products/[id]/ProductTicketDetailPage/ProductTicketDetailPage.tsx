"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import {
  fetchNotificationById,
  updateNotificationApi,
  type ProductContent,
  type UnifiedNotification,
} from "@/app/contents/notifications.types";

const BASE = "/logged/pages/tickets";

const ProductTicketDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const ticketId = Array.isArray(idParam) ? idParam[0] : (idParam as string) || "";

  const [unified, setUnified] = useState<UnifiedNotification | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialDraft: ProductContent = useMemo(
    () => ({
      product_name: "",
      product_description: "",
      product_price: 0,
      company_id: "",
      product_main_image_src: "",
      product_categories_array: [],
    }),
    []
  );
  const [draft, setDraft] = useState<ProductContent>(initialDraft);

  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    const decoded = decodeURIComponent(ticketId).trim();
    fetchNotificationById(decoded)
      .then((data) => {
        setUnified(data);
        const pc = data.product_content;
        if (pc) {
          setDraft({
            product_name: pc.product_name ?? "",
            product_description: pc.product_description ?? "",
            product_price: Number(pc.product_price ?? 0) || 0,
            company_id: pc.company_id ?? "",
            product_main_image_src: pc.product_main_image_src ?? "",
            product_categories_array: Array.isArray(pc.product_categories_array) ? pc.product_categories_array : [],
          });
        } else {
          setDraft(initialDraft);
        }
        setError(null);
      })
      .catch((e: unknown) => {
        setUnified(null);
        setError(e instanceof Error ? e.message : "Ticket not found.");
      })
      .finally(() => setLoading(false));
  }, [ticketId, initialDraft]);

  useEffect(() => {
    setPageMeta({
      pageTitle: "Product Ticket",
      breadcrumbs: [
        { label: "Tickets", href: BASE },
        { label: "Product Tickets", href: `${BASE}?tab=product` },
        { label: ticketId || "Detail" },
      ],
      buttons: [{ label: "Back to Tickets", href: `${BASE}?tab=product` }],
    });
  }, [setPageMeta, ticketId]);

  const categoriesText = useMemo(() => (draft.product_categories_array ?? []).join(", "), [draft.product_categories_array]);

  const setCategoriesFromText = (raw: string) => {
    const list = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    setDraft((prev) => ({ ...prev, product_categories_array: Array.from(new Set(list)) }));
  };

  const handleSave = async () => {
    if (!ticketId) return;
    setSaving(true);
    try {
      const decoded = decodeURIComponent(ticketId).trim();
      const updated = await updateNotificationApi(decoded, { product_content: draft });
      setUnified(updated);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save product ticket.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!ticketId) return;
    setCreateLoading(true);
    try {
      const decoded = decodeURIComponent(ticketId).trim();
      const updated = await updateNotificationApi(decoded, {
        state: "solved",
        product_content: draft,
        fulfill_product: true,
      });
      setUnified(updated);
      setError(null);
      router.push(`${BASE}?tab=product`);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create product.");
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContentSection>
        <div className="bg-white rounded-b-lg overflow-hidden p-6 text-gray-600">Loading...</div>
      </PageContentSection>
    );
  }

  if (error || !unified) {
    return (
      <PageContentSection>
        <div className="bg-white rounded-b-lg overflow-hidden p-6 text-gray-600">
          <p className="text-red-600">{error || "Ticket not found."}</p>
          <button
            type="button"
            onClick={() => router.push(`${BASE}?tab=product`)}
            className="mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80"
          >
            Back to Product Tickets
          </button>
        </div>
      </PageContentSection>
    );
  }

  const isSolved = String(unified.state) === "solved";

  return (
    <>
      <PageContentSection>
        <div className="bg-white rounded-b-lg overflow-hidden p-6 text-gray-600 space-y-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Ticket ID</label>
            <p className="text-lg text-gray-900 font-mono">{unified.id}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Company ID</label>
              <input
                value={draft.company_id}
                onChange={(e) => setDraft((p) => ({ ...p, company_id: e.target.value }))}
                disabled={isSolved}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Product name</label>
              <input
                value={draft.product_name}
                onChange={(e) => setDraft((p) => ({ ...p, product_name: e.target.value }))}
                disabled={isSolved}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Price</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={Number.isFinite(draft.product_price) ? draft.product_price : 0}
                onChange={(e) => setDraft((p) => ({ ...p, product_price: Number(e.target.value) || 0 }))}
                disabled={isSolved}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Main image src</label>
              <input
                value={draft.product_main_image_src}
                onChange={(e) => setDraft((p) => ({ ...p, product_main_image_src: e.target.value }))}
                disabled={isSolved}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Categories (comma-separated)</label>
              <input
                value={categoriesText}
                onChange={(e) => setCategoriesFromText(e.target.value)}
                disabled={isSolved}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <textarea
                value={draft.product_description}
                onChange={(e) => setDraft((p) => ({ ...p, product_description: e.target.value }))}
                rows={6}
                disabled={isSolved}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-gray-900 disabled:bg-gray-100 whitespace-pre-wrap"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || isSolved}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                saving || isSolved ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-950 text-white hover:bg-blue-900"
              }`}
            >
              {saving ? "Saving..." : isSolved ? "Solved" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => void handleCreateProduct()}
              disabled={createLoading || isSolved}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                createLoading || isSolved
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-green-700 text-white hover:bg-green-800"
              }`}
            >
              {createLoading ? "Creating..." : "Create product"}
            </button>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default ProductTicketDetailPage;

