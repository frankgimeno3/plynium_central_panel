"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { ContentTopicService } from "@/app/service/ContentTopicService";
import { PortalService } from "@/app/service/PortalService";

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

const ContentTopicsPage: FC = () => {
  const router = useRouter();
  const [topics, setTopics] = useState<ContentTopicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalNameById, setPortalNameById] = useState<Record<number, string>>({});

  const topicHref = (id: number) => `/logged/pages/network/contents/topics/${id}`;
  const createHref = `/logged/pages/network/contents/topics/create`;

  const loadTopics = useCallback(async () => {
    try {
      const list = await ContentTopicService.getTopics();
      const raw = Array.isArray(list) ? list : [];
      setTopics(raw.filter((t) => t != null && typeof t.topic_id === "number") as ContentTopicRow[]);
    } catch {
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

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

  const portalLabel = useCallback(
    (portalId: number) => {
      return portalNameById[portalId] ?? `Portal ${portalId}`;
    },
    [portalNameById]
  );

  const portalsCell = useCallback(
    (ids?: number[]) => {
      if (!Array.isArray(ids) || ids.length === 0) return "—";
      return ids.map((id) => portalLabel(id)).join(", ");
    },
    [portalLabel]
  );

  const breadcrumbs = [{ label: "Content Topics" }];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Content Topics", breadcrumbs, buttons: [] });
  }, [setPageMeta]);

  return (
    <PageContentSection>
      <div className="flex w-full flex-col">
        <div className="overflow-hidden rounded-b-lg bg-white">
          <div className="p-6">
            {loading ? (
              <p className="text-sm text-gray-500">Loading content topics…</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => router.push(createHref)}
                    className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Create
                  </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Portales</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {topics.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                          No topics found. Run migration{" "}
                          <code className="rounded bg-gray-100 px-1">066_topics_db_and_user_feed_preferences.sql</code>{" "}
                          on your RDS if you have not yet.
                        </td>
                      </tr>
                    ) : (
                      topics.map((t) => (
                        <tr
                          key={t.topic_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(topicHref(t.topic_id))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(topicHref(t.topic_id));
                            }
                          }}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{t.topic_id}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                            {portalsCell(t.topic_portal_ids)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.topic_name}</td>
                          <td className="max-w-md truncate px-4 py-3 text-sm text-gray-600">
                            {t.topic_description?.trim() ? t.topic_description : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                            {formatTs(t.topic_created_at)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                            {formatTs(t.topic_updated_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContentSection>
  );
};

export default ContentTopicsPage;
