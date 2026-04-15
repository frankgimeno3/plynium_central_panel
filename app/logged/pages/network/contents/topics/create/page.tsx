 "use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import { ContentTopicService } from "@/app/service/ContentTopicService";
import { PortalService } from "@/app/service/PortalService";
import { TopicPortalsModal } from "../[topic_id]/TopicPortalsModal";

const ContentTopicCreatePage: FC = () => {
  const router = useRouter();
  const { setPageMeta } = usePageContent();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const [portalsModalOpen, setPortalsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [portalNameById, setPortalNameById] = useState<Record<number, string>>({});

  const listHref = "/logged/pages/network/contents/topics";

  useEffect(() => {
    setPageMeta({
      pageTitle: "Create topic",
      breadcrumbs: [{ label: "Content Topics", href: listHref }, { label: "Create" }],
      buttons: [],
    });
  }, [setPageMeta]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await PortalService.getAllPortals();
        const rows = Array.isArray(list) ? list : [];
        const next: Record<number, string> = {};
        for (const p of rows) {
          const id = p?.id;
          if (!Number.isFinite(Number(id))) continue;
          const name = typeof p?.name === "string" && p.name.trim() ? p.name.trim() : `Portal ${Number(id)}`;
          next[Number(id)] = name;
        }
        if (!cancelled) setPortalNameById(next);
      } catch {
        if (!cancelled) setPortalNameById({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const portalLabel = useMemo(() => {
    return (portalId: number) => portalNameById[portalId] ?? `Portal ${portalId}`;
  }, [portalNameById]);

  const canCreate = useMemo(() => {
    return name.trim().length > 0 && selectedPortalIds.length > 0 && !saving;
  }, [name, selectedPortalIds, saving]);

  const create = async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (selectedPortalIds.length === 0) {
      setError("Selecciona al menos 1 portal.");
      return;
    }
    setSaving(true);
    try {
      const created = await ContentTopicService.createTopic({
        topic_name: trimmed,
        topic_description: String(description ?? ""),
        topic_portal_ids: selectedPortalIds,
      });
      const id = created?.topic_id;
      if (typeof id === "number") {
        router.push(`/logged/pages/network/contents/topics/${id}`);
      } else {
        router.push(listHref);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "No se pudo crear el topic.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContentSection>
      <div className="flex w-full flex-col">
        <div className="overflow-hidden rounded-b-lg bg-white">
          <div className="p-6">
            <div className="mb-6">
              <Link
                href={listHref}
                className="text-sm font-medium text-blue-900 hover:text-blue-700 hover:underline"
              >
                ← Back to Content Topics
              </Link>
            </div>

            <div className="max-w-2xl space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-semibold text-gray-900">Create topic</h1>
                  <p className="mt-1 text-xs text-gray-500">Asocia el topic a al menos 1 portal.</p>
                </div>
                <button
                  type="button"
                  disabled={!canCreate}
                  onClick={create}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Creando…" : "Crear"}
                </button>
              </div>

              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <div className="space-y-3 rounded-lg border border-gray-200 p-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Topic name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                    placeholder="Topic description"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-gray-700">Portales</div>
                      <div className="text-xs text-gray-500">Selecciona al menos 1 portal.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPortalsModalOpen(true)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Agregar / editar
                    </button>
                  </div>

                  {selectedPortalIds.length === 0 ? (
                    <div className="text-sm text-gray-500">—</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedPortalIds.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-800"
                        >
                          {portalLabel(id)}
                          <button
                            type="button"
                            onClick={() => setSelectedPortalIds((prev) => prev.filter((x) => x !== id))}
                            className="rounded px-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                            aria-label={`Remove portal ${id}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TopicPortalsModal
        open={portalsModalOpen}
        initialSelectedIds={selectedPortalIds}
        onClose={() => setPortalsModalOpen(false)}
        onApply={(ids) => {
          setSelectedPortalIds(ids);
          setPortalsModalOpen(false);
        }}
      />
    </PageContentSection>
  );
};

export default ContentTopicCreatePage;

