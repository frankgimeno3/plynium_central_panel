"use client";

import React, { FC, useEffect, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PublicationService } from "@/app/service/PublicationService";
import { PlannedPublicationDetailLoading } from "./planned_publication_detail_components/PlannedPublicationDetailLoading";
import { PlannedPublicationDetailNotFound } from "./planned_publication_detail_components/PlannedPublicationDetailNotFound";
import { PlannedPublicationDetailSummaryGrid } from "./planned_publication_detail_components/PlannedPublicationDetailSummaryGrid";
import type { PlannedPublicationDetailRow } from "./planned_publication_detail_components/types";

export type PlannedPublicationDetailPageProps = {
  idPlannedPublication: string;
};

const PlannedPublicationDetailPage: FC<PlannedPublicationDetailPageProps> = ({
  idPlannedPublication,
}) => {
  const [publication, setPublication] = useState<PlannedPublicationDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setLoading(true);
    PublicationService.getPublicationById(idPlannedPublication)
      .then((p: Record<string, unknown>) => {
        const id = String(
          p?.id_publication ?? p?.publication_id ?? p?.id ?? ""
        ).trim();
        if (!id) {
          setPublication(null);
          return;
        }
        setPublication({
          id_publication: id,
          edition_name:
            p?.edition_name != null ? String(p.edition_name) : undefined,
          theme: p?.theme != null ? String(p.theme) : undefined,
          publication_date:
            p?.publication_date != null
              ? String(p.publication_date)
              : undefined,
          id_magazine:
            p?.id_magazine != null ? String(p.id_magazine) : undefined,
        });
      })
      .catch(() => setPublication(null))
      .finally(() => setLoading(false));
  }, [idPlannedPublication]);

  useEffect(() => {
    const title =
      publication?.edition_name || publication?.id_publication || idPlannedPublication;
    setPageMeta({
      pageTitle: publication ? title : "Publication not found",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        {
          label: "Planned Publications",
          href: "/logged/pages/production/publications_management",
        },
        { label: title },
      ],
      buttons: [
        {
          label: "Back to Planned Publications",
          href: "/logged/pages/production/publications_management",
        },
      ],
    });
  }, [setPageMeta, publication, idPlannedPublication]);

  if (loading) {
    return <PlannedPublicationDetailLoading />;
  }

  if (!publication) {
    return <PlannedPublicationDetailNotFound />;
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <PlannedPublicationDetailSummaryGrid publication={publication} />
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default PlannedPublicationDetailPage;
