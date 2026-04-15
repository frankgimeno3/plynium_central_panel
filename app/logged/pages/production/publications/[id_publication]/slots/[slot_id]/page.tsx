"use client";

import React, { FC, use, useEffect, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

type SlotRow = {
  publication_slot_id: number;
  publication_id: string | null;
  publication_format: string;
  slot_key: string;
  slot_content_type: string;
  slot_state: string;
  customer_id: string | null;
  project_id: string | null;
  slot_media_url: string | null;
  slot_article_id: string | null;
  slot_created_at: string | null;
  slot_updated_at: string | null;
};

type SlotContentRow = {
  publication_slot_content_id: number;
  publication_id: string;
  publication_slot_id: number;
  publication_slot_position: number;
  slot_content_format: string;
  slot_content_object_array: unknown[];
};

const BASE = "/logged/pages/production/publications";

const SlotDetailPage: FC<{ params: Promise<{ id_publication: string; slot_id: string }> }> = ({ params }) => {
  const { id_publication, slot_id } = use(params);
  const slotIdNum = Number(slot_id);
  const { setPageMeta } = usePageContent();

  const [slot, setSlot] = useState<SlotRow | null>(null);
  const [contents, setContents] = useState<SlotContentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [slotRes, contentRes] = await Promise.all([
          fetch(`/api/v1/publication-slots/${slotIdNum}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`/api/v1/publications-db/${encodeURIComponent(id_publication)}/slots/${slotIdNum}/contents`, {
            cache: "no-store",
            credentials: "include",
          }),
        ]);
        if (!slotRes.ok) throw new Error("Failed to load slot");
        const slotData = (await slotRes.json()) as SlotRow;
        const contentData = contentRes.ok ? ((await contentRes.json()) as SlotContentRow[]) : [];

        if (!cancelled) {
          setSlot(slotData);
          setContents(Array.isArray(contentData) ? contentData : []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setSlot(null);
          setContents([]);
          setError(e?.message ?? "Failed to load slot");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id_publication, slotIdNum]);

  useEffect(() => {
    const label = slot ? `Slot ${slot.slot_key}` : `Slot #${slotIdNum}`;
    setPageMeta({
      pageTitle: label,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: id_publication, href: `${BASE}/${encodeURIComponent(id_publication)}` },
        { label },
      ],
      buttons: [{ label: "Back to Flatplan", href: `${BASE}/${encodeURIComponent(id_publication)}` }],
    });
  }, [setPageMeta, slot?.slot_key, slotIdNum, id_publication]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading slot…</div>
      </PageContentSection>
    );
  }

  if (!slot) {
    return (
      <PageContentSection>
        <div className="p-6 text-center">
          <p className="text-gray-600">{error ?? "Slot not found."}</p>
          <Link
            href={`${BASE}/${encodeURIComponent(id_publication)}`}
            className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Back to Flatplan
          </Link>
        </div>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection>
      <div className="flex flex-col w-full">
        <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase">Slot key</p>
                <p className="font-medium text-gray-900">{slot.slot_key}</p>
                <p className="text-xs text-gray-400 mt-0.5">#{slot.publication_slot_id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Type</p>
                <p className="text-gray-800">{slot.slot_content_type || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">State</p>
                <p className="text-gray-800">{slot.slot_state || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Customer</p>
                <p className="text-gray-800">{slot.customer_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Project</p>
                <p className="text-gray-800">{slot.project_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Article ID</p>
                <p className="text-gray-800">{slot.slot_article_id ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Slot contents</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Object array (JSON)</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {contents.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-sm text-gray-500">
                          No content entries found for this slot.
                        </td>
                      </tr>
                    ) : (
                      contents.map((c) => (
                        <tr key={c.publication_slot_content_id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{c.publication_slot_position}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{c.slot_content_format || "—"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-[260px]">
                              {JSON.stringify(c.slot_content_object_array ?? [], null, 2)}
                            </pre>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default SlotDetailPage;

