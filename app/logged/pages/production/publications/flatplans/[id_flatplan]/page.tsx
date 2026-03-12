"use client";

import React, { FC, use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import flatplansData from "@/app/contents/flatplans.json";
import { Flatplan, FlatplanSlot } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/flatplans";

const SLOT_ORDER: (keyof Flatplan)[] = ["cover", "inside_cover", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "end"];

const FlatplanDetailPage: FC<{ params: Promise<{ id_flatplan: string }> }> = ({ params }) => {
  const router = useRouter();
  const { id_flatplan } = use(params);
  const flatplan = (flatplansData as Flatplan[]).find((f) => f.id_flatplan === id_flatplan);
  const [activeTab, setActiveTab] = useState<"preview" | "production">("preview");
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    if (flatplan) {
      setPageMeta({
        pageTitle: flatplan.edition_name,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Flatplans", href: BASE },
          { label: flatplan.edition_name },
        ],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    } else {
      setPageMeta({
        pageTitle: "Flatplan not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Flatplans", href: BASE },
        ],
        buttons: [{ label: "Back to Flatplans", href: BASE }],
      });
    }
  }, [setPageMeta, flatplan]);

  if (!flatplan) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-gray-500">Flatplan not found.</p>
              <button
                type="button"
                onClick={() => router.push(BASE)}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Back to Flatplans
              </button>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const slots = SLOT_ORDER.filter(
    (key) => key in flatplan && typeof (flatplan as Record<string, unknown>)[key] === "object"
  ) as (keyof Flatplan)[];

  const renderSlot = (slotKey: string, slot: FlatplanSlot) => {
    const isArticle = slot.content_type === "article";
    return (
      <div key={slotKey} className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <span className="font-medium text-gray-900 capitalize">{slotKey.replace("_", " ")}</span>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              slot.state === "content ok" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {slot.state}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              slot.content_type === "article" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
            }`}
          >
            {slot.content_type}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-gray-500 uppercase">Advertiser</p>
            <p className="font-mono">{slot.id_advertiser}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Project</p>
            <p className="font-mono">{slot.id_project}</p>
          </div>
          {isArticle && slot.article_id ? (
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase">Article ID</p>
              <p className="font-mono">{slot.article_id}</p>
            </div>
          ) : (
            slot.image_src && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 uppercase mb-1">Image</p>
                <div className="aspect-video max-w-xs bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <img src={slot.image_src} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-gray-500 uppercase">ID</p>
            <p className="font-medium">{flatplan.id_flatplan}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Edition name</p>
            <p className="font-medium">{flatplan.edition_name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Theme</p>
            <p className="font-medium">{flatplan.theme}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Publication date</p>
            <p className="font-medium">{flatplan.publication_date}</p>
          </div>
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>

      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "preview"
                ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Flatplan preview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("production")}
            className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "production"
                ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            Production sheet
          </button>
        </div>
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">

        {activeTab === "preview" && (
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Flatplan preview</h3>
            <p className="text-sm text-gray-600">
              Visual preview of the flatplan layout for <strong>{flatplan.edition_name}</strong>. Page order and
              placement can be adjusted here before publishing.
            </p>
            <div className="mt-4 aspect-video max-w-2xl bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
              Flatplan preview placeholder
            </div>
          </div>
        )}

        {activeTab === "production" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Publication layout</h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {slots.map((key) => {
                const slot = (flatplan as Record<string, unknown>)[key] as FlatplanSlot | undefined;
                return slot ? renderSlot(key as string, slot) : null;
              })}
            </div>
          </div>
        )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default FlatplanDetailPage;
