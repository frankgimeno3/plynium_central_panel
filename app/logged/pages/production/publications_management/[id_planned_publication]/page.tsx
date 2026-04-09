"use client";

import React, { FC, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import publicationsData from "@/app/contents/publications.json";
import { getPlanned } from "@/app/contents/publicationsHelpers";
import type { PublicationUnified } from "@/app/contents/interfaces";

type PublicationSlot = {
  publication_slot_id?: number;
  publication_id?: string | null;
  publication_format?: "flipbook" | "informer";
  slot_key?: string;
  slot_content_type: string;
  slot_state: string;
  customer_id?: string;
  project_id?: string;
  slot_media_url?: string;
  slot_article_id?: string;
};

type PlannedPublication = PublicationUnified & {
  cover?: PublicationSlot;
  inside_cover?: PublicationSlot;
  end?: PublicationSlot;
  "1"?: PublicationSlot;
  "2"?: PublicationSlot;
  "3"?: PublicationSlot;
  "4"?: PublicationSlot;
  "5"?: PublicationSlot;
  "6"?: PublicationSlot;
  "7"?: PublicationSlot;
  "8"?: PublicationSlot;
  "9"?: PublicationSlot;
  "10"?: PublicationSlot;
};

function plannedFromUnified(p: PublicationUnified): PlannedPublication {
  const slots: Record<string, PublicationSlot> = {};
  if (p.cover) slots.cover = p.cover;
  if (p.inside_cover) slots.inside_cover = p.inside_cover;
  (p.pages || []).forEach((s) => { slots[s.slot_key || ""] = s; });
  if (p.end) slots.end = p.end;
  return { ...p, ...slots } as PlannedPublication;
}

const SLOT_ORDER: string[] = ["cover", "inside_cover", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "end"];

const PublicationDetailPage: FC<{ params: Promise<{ id_planned_publication: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_planned_publication } = use(params);
  const list = getPlanned(publicationsData as PublicationUnified[]);
  const pub = list.find((p) => p.id_planned_publication === id_planned_publication);
  const publication = pub ? plannedFromUnified(pub) : undefined;
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (publication) {
      setPageMeta({
        pageTitle: publication.edition_name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Planned Publications", href: "/logged/pages/production/publications_management" },
          { label: publication.edition_name },
        ],
        buttons: [{ label: "Back to Planned Publications", href: "/logged/pages/production/publications_management" }],
      });
    } else {
      setPageMeta({
        pageTitle: "Publication not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Planned Publications", href: "/logged/pages/production/publications_management" },
        ],
        buttons: [{ label: "Back to Planned Publications", href: "/logged/pages/production/publications_management" }],
      });
    }
  }, [setPageMeta, publication]);

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

  const publicationSlots = publication as unknown as Record<string, unknown>;
  const slots = SLOT_ORDER.filter((key) => key in publication && typeof publicationSlots[key] === "object");

  const renderSlot = (slotKey: string, slot: PublicationSlot) => {
    const isArticle = slot.slot_content_type === "article";
    return (
      <div key={slotKey} className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-medium text-gray-900 capitalize">{slotKey.replace("_", " ")}</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${slot.slot_state === "content ok" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
            {slot.slot_state}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${slot.slot_content_type === "article" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>
            {slot.slot_content_type}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase">Advertiser</p>
            <p className="font-mono">{slot.customer_id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Project</p>
            <p className="font-mono">{slot.project_id}</p>
          </div>
          {isArticle && slot.slot_article_id ? (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase">Article ID</p>
              <p className="font-mono">{slot.slot_article_id}</p>
            </div>
          ) : (
            slot.slot_media_url && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase mb-1">Image</p>
                <div className="aspect-video max-w-xs bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img src={slot.slot_media_url} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Planned Publications", href: "/logged/pages/production/publications_management" },
    { label: publication.edition_name },
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
            <p className="font-medium">{publication.id_planned_publication}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Edition name</p>
            <p className="font-medium">{publication.edition_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Theme</p>
            <p className="font-medium">{publication.theme}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publication date</p>
            <p className="font-medium">{publication.publication_date}</p>
          </div>
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication layout</h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {slots.map((key) => {
            const slot = publicationSlots[key] as PublicationSlot | undefined;
            return slot ? renderSlot(key, slot) : null;
          })}
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default PublicationDetailPage;
