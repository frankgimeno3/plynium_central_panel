"use client";

import React, { FC, use, useEffect, useState } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import {
  PreferentialSlotApiRow,
  PreferentialSlotBlock,
} from "../../[id_publication]/_shared";

const BASE = "/logged/pages/production/publications/preferential-pages";
const PUBLICATIONS_BASE = "/logged/pages/production/publications";
const CONTRACTS_BASE = "/logged/pages/account-management/contracts";

type PublicationSummary = {
  publication_id: string;
  publication_edition_name: string;
  publication_status: string;
  magazine_id: string | null;
};

const PreferentialPublicationDetailPage: FC<{ publicationId: string }> = ({ publicationId }) => {
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
        { label: "Preferential pages", href: BASE },
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
          href={BASE}
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Back to preferential pages
        </Link>
      </PageContentSection>
    );
  }

  return (
    <PageContentSection className="pt-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {publication.publication_edition_name || publication.publication_id}
          </h1>
          <p className="font-mono text-xs text-gray-500">{publication.publication_id}</p>
          <p className="text-sm text-gray-600">Status: {publication.publication_status || "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={BASE}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Back to preferential pages
          </Link>
          <Link
            href={`${PUBLICATIONS_BASE}/issues/${encodeURIComponent(publication.publication_id)}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open publication issue
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {slots.map((slot) => {
          const contractId = String(slot.contract_id ?? "").trim();
          const isSold = String(slot.state ?? "").toLowerCase() === "bought" || Boolean(contractId);
          return (
            <div
              key={`${slot.position_in_magazine}:${slot.preferential_slot_id ?? "missing"}`}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{slot.section_title}</p>
                  <p className="text-xs text-gray-500">{slot.position_in_magazine}</p>
                </div>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-700">
                  {slot.state || "—"}
                </span>
              </div>

              <PreferentialSlotBlock slot={slot} />

              {isSold && contractId ? (
                <Link
                  href={`${CONTRACTS_BASE}/${encodeURIComponent(contractId)}`}
                  className="mt-3 block rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 hover:border-emerald-300 hover:shadow-sm"
                >
                  <p className="text-[10px] uppercase tracking-wide text-emerald-700">Sold contract</p>
                  <p className="font-mono text-xs">{contractId}</p>
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </PageContentSection>
  );
};

const PreferentialPublicationRoutePage: FC<{ params: Promise<{ publication_id: string }> }> = ({
  params,
}) => {
  const { publication_id } = use(params);
  return <PreferentialPublicationDetailPage publicationId={publication_id} />;
};

export default PreferentialPublicationRoutePage;
