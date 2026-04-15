"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ContentTopicService } from "@/app/service/ContentTopicService";
import { PortalService } from "@/app/service/PortalService";
import { TopicPortalsModal } from "./TopicPortalsModal";

type ContentTopicRow = {
  topic_id: number;
  topic_portal_ids?: number[];
  topic_name: string;
  topic_description: string;
  topic_created_at: string | null;
  topic_updated_at: string | null;
};

function formatTs(value: string | null): string {
  if (value == null || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

const ContentTopicDetailPage: FC = () => {
  const params = useParams();
  const topicIdParam = params?.topic_id as string | undefined;
  const [topic, setTopic] = useState<ContentTopicRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [selectedPortalIds, setSelectedPortalIds] = useState<number[]>([]);
  const [portalsModalOpen, setPortalsModalOpen] = useState(false);
  const [portalNameById, setPortalNameById] = useState<Record<number, string>>({});

  const loadTopic = useCallback(async () => {
    if (topicIdParam == null || topicIdParam === "") {
      setNotFound(true);
      setLoading(false);
      return;
    }
    const idNum = parseInt(topicIdParam, 10);
    if (!Number.isFinite(idNum)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    try {
      const row = await ContentTopicService.getTopicById(idNum);
      if (row) setTopic(row as ContentTopicRow);
      else setNotFound(true);
    } catch (e: unknown) {
      const status = typeof e === "object" && e !== null && "status" in e ? (e as { status?: number }).status : undefined;
      if (status === 404) setNotFound(true);
      else setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [topicIdParam]);

  useEffect(() => {
    loadTopic();
  }, [loadTopic]);

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

  useEffect(() => {
    if (!topic) return;
    setEditName(topic.topic_name ?? "");
    setEditDescription(topic.topic_description ?? "");
    const fromApi = Array.isArray(topic.topic_portal_ids) ? topic.topic_portal_ids : undefined;
    setSelectedPortalIds(
      fromApi && fromApi.length > 0 ? fromApi : []
    );
  }, [topic]);

  const listHref = "/logged/pages/network/contents/topics";

  const breadcrumbs = topic
    ? [
        { label: "Content Topics", href: listHref },
        { label: topic.topic_name || `Topic ${topic.topic_id}` },
      ]
    : [{ label: "Content Topics", href: listHref }, { label: "…" }];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: topic ? topic.topic_name || "Content topic" : "Content topic",
      breadcrumbs,
      buttons: [],
    });
  }, [setPageMeta, breadcrumbs, topic]);

  const topicIdNum = useMemo(() => {
    const n = topicIdParam ? parseInt(topicIdParam, 10) : NaN;
    return Number.isFinite(n) ? n : null;
  }, [topicIdParam]);

  const hasChanges = useMemo(() => {
    if (!topic) return false;
    const currentPortalIds = Array.isArray(topic.topic_portal_ids)
      ? topic.topic_portal_ids
      : [];
    const samePortals =
      currentPortalIds.length === selectedPortalIds.length &&
      currentPortalIds.every((id) => selectedPortalIds.includes(id));
    return (
      (editName ?? "") !== (topic.topic_name ?? "") ||
      (editDescription ?? "") !== (topic.topic_description ?? "") ||
      !samePortals
    );
  }, [topic, editName, editDescription, selectedPortalIds]);

  const save = useCallback(async () => {
    if (!topic || topicIdNum == null) return;
    setError(null);
    const portalId = selectedPortalIds.length > 0 ? selectedPortalIds[0] : null;
    if (portalId == null) {
      setError("Selecciona al menos 1 portal.");
      return;
    }
    setSaving(true);
    try {
      const updated = await ContentTopicService.updateTopic(topicIdNum, {
        topic_name: String(editName ?? "").trim(),
        topic_description: String(editDescription ?? ""),
        topic_portal_ids: selectedPortalIds,
      });
      if (updated) setTopic(updated as ContentTopicRow);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? "No se pudo guardar el topic.");
    } finally {
      setSaving(false);
    }
  }, [topic, topicIdNum, editName, editDescription, selectedPortalIds]);

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

            {loading ? (
              <p className="text-sm text-gray-500">Loading topic…</p>
            ) : notFound || !topic ? (
              <p className="text-sm text-gray-600">Topic not found.</p>
            ) : (
              <div className="max-w-2xl space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-2xl font-semibold text-gray-900">{topic.topic_name}</h1>
                    <p className="mt-1 text-xs text-gray-500">ID {topic.topic_id}</p>
                  </div>
                  <button
                    type="button"
                    disabled={!hasChanges || saving}
                    onClick={save}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Guardando…" : "Guardar"}
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
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none"
                      placeholder="Topic name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">Descripción</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
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

                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-gray-500">Topic ID</dt>
                    <dd className="text-gray-900">{topic.topic_id}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Portales</dt>
                    <dd className="text-gray-900">
                      {Array.isArray(topic.topic_portal_ids) && topic.topic_portal_ids.length > 0
                        ? topic.topic_portal_ids.map((id) => portalLabel(id)).join(", ")
                        : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-gray-500">Description</dt>
                    <dd className="whitespace-pre-wrap text-gray-900">
                      {topic.topic_description?.trim() ? topic.topic_description : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Created</dt>
                    <dd className="text-gray-900">{formatTs(topic.topic_created_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-500">Updated</dt>
                    <dd className="text-gray-900">{formatTs(topic.topic_updated_at)}</dd>
                  </div>
                </dl>
              </div>
            )}
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

export default ContentTopicDetailPage;
