"use client";

import React, { FC, useEffect, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PreferentialSlotApiRow } from "../../../[id_publication]/_shared";
import { PREFERENTIAL_PAGES_BASE, PUBLICATIONS_BASE } from "./preferential_publication_constants";
import type { PublicationSummary } from "./preferential_publication_types";
import { PreferentialPublicationDetailHeader } from "./preferential_publication_detail_components/PreferentialPublicationDetailHeader";
import { PreferentialPublicationSlotsGrid } from "./preferential_publication_detail_components/PreferentialPublicationSlotsGrid";

export const PreferentialPublicationDetailPage: FC<{ publicationId: string }> = ({ publicationId }) => {
  const { setPageMeta } = usePageContent();
  const [publication, setPublication] = useState<PublicationSummary | null>(null);
  const [slots, setSlots] = useState<PreferentialSlotApiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pubRes, prefRes] = await Promise.all([
          fetch(`/api/v1/publications-db/${encodeURIComponent(publicationId)}`, {
            cache: "no-store",
            credentials: "include",
          }),
          fetch(`/api/v1/publications/${encodeURIComponent(publicationId)}/preferential-slots`, {
            cache: "no-store",
            credentials: "include",
          }),
        ]);
        if (!pubRes.ok) throw new Error("Publication not found.");
        const pub = (await pubRes.json()) as PublicationSummary;
        const prefJson = prefRes.ok
          ? ((await prefRes.json()) as { slots?: PreferentialSlotApiRow[] })
          : { slots: [] };
        if (cancelled) return;
        setPublication(pub);
        setSlots(Array.isArray(prefJson?.slots) ? prefJson.slots : []);
      } catch (e: unknown) {
        if (!cancelled) {
          setPublication(null);
          setSlots([]);
          setError(e instanceof Error ? e.message : "Failed to load preferential pages.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicationId]);

  useEffect(() => {
    const title = publication?.publication_edition_name || publicationId;
    setPageMeta({
      pageTitle: title,
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${PUBLICATIONS_BASE}/issues` },
        { label: "Preferential pages", href: PREFERENTIAL_PAGES_BASE },
        { label: title },
      ],
    });
  }, [publication?.publication_edition_name, publicationId, setPageMeta]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading preferential pages…</div>
      </PageContentSection>
    );
  }

  if (error || !publication) {
    return (
      <PageContentSection>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error || "Publication not found."}
        </div>
        <Link
          href={PREFERENTIAL_PAGES_BASE}
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to preferential pages
        </Link>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection className="pt-4">
      <PreferentialPublicationDetailHeader publication={publication} />
      <PreferentialPublicationSlotsGrid slots={slots} />
    </PageContentSection>
  );
};
