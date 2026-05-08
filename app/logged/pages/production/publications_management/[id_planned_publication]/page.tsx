"use client";

import React, { FC, use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PublicationService } from "@/app/service/PublicationService";

type PublicationRow = {
  id_publication: string;
  edition_name?: string;
  theme?: string;
  publication_date?: string;
  id_magazine?: string;
};

const PublicationDetailPage: FC<{ params: Promise<{ id_planned_publication: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_planned_publication } = use(params);
  const [publication, setPublication] = useState<PublicationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setLoading(true);
    PublicationService.getPublicationById(id_planned_publication)
      .then((p: any) => {
        const id = String(p?.id_publication ?? p?.publication_id ?? p?.id ?? "").trim();
        if (!id) {
          setPublication(null);
          return;
        }
        setPublication({
          id_publication: id,
          edition_name: p?.edition_name != null ? String(p.edition_name) : undefined,
          theme: p?.theme != null ? String(p.theme) : undefined,
          publication_date: p?.publication_date != null ? String(p.publication_date) : undefined,
          id_magazine: p?.id_magazine != null ? String(p.id_magazine) : undefined,
        });
      })
      .catch(() => setPublication(null))
      .finally(() => setLoading(false));
  }, [id_planned_publication]);

  useEffect(() => {
    const title = publication?.edition_name || publication?.id_publication || id_planned_publication;
    setPageMeta({
      pageTitle: publication ? title : "Publication not found",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Planned Publications", href: "/logged/pages/production/publications_management" },
        { label: title },
      ],
      buttons: [{ label: "Back to Planned Publications", href: "/logged/pages/production/publications_management" }],
    });
  }, [setPageMeta, publication, id_planned_publication]);

  if (loading) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Loading…</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (!publication) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-500">Publication not found.</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Planned Publications", href: "/logged/pages/production/publications_management" },
    { label: publication.edition_name ?? publication.id_publication },
  ];

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{publication.id_publication}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Edition name</p>
            <p className="font-medium">{publication.edition_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Theme</p>
            <p className="font-medium">{publication.theme ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publication date</p>
            <p className="font-medium">{publication.publication_date ?? "—"}</p>
          </div>
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default PublicationDetailPage;
