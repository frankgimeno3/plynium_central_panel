"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import publicationsData from "@/app/contents/publications.json";
import { publicationInterface } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/published";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?q=80&w=2340&auto=format&fit=crop";

export default function PublishedDetailPage({ params }: { params: Promise<{ id_publication: string }> }) {
  const router = useRouter();
  const { id_publication } = use(params);
  const [publication, setPublication] = useState<publicationInterface | null>(null);

  useEffect(() => {
    const list = publicationsData as publicationInterface[];
    const found = list.find((p) => p.id_publication === id_publication) ?? null;
    setPublication(found);
  }, [id_publication]);

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (publication) {
      const pageTitle = `${publication.revista} - ${publication.número}`;
      const buttons: { label: string; href: string }[] = [{ label: "Back to Published", href: BASE }];
      if (publication.redirectionLink) buttons.push({ label: "Open flipbook", href: publication.redirectionLink });
      setPageMeta({
        pageTitle,
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Published", href: BASE },
          { label: pageTitle },
        ],
        buttons,
      });
    } else {
      setPageMeta({
        pageTitle: "Publication not found",
        breadcrumbs: [
          { label: "Production", href: "/logged/pages/production/services" },
          { label: "Publications", href: BASE },
          { label: "Published", href: BASE },
        ],
        buttons: [{ label: "Back to Published", href: BASE }],
      });
    }
  }, [setPageMeta, publication]);

  if (!publication) {
    return (
      <PageContentSection>
        <p className="text-gray-500">Publication not found.</p>
        <button
          type="button"
          onClick={() => router.push(BASE)}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Back to Published
        </button>
      </PageContentSection>
    );
  }

  const imageUrl =
    publication.publication_main_image_url && publication.publication_main_image_url.trim() !== ""
      ? publication.publication_main_image_url
      : DEFAULT_IMAGE;

  return (
    <PageContentSection>
      <div className="flex flex-col gap-6 max-w-2xl">
        <div className="rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
          <img
            src={imageUrl}
            alt={`${publication.revista} - ${publication.número}`}
            className="w-full aspect-[4/5] object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (target.src !== DEFAULT_IMAGE) target.src = DEFAULT_IMAGE;
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <p className="text-xs text-gray-500 uppercase">Publication name</p>
            <p className="font-semibold text-gray-900">
              {publication.revista} - {publication.número}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Date</p>
            <p className="text-gray-700">{publication.date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Magazine</p>
            <p className="text-gray-700">{publication.revista}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase">Issue / Edition</p>
            <p className="text-gray-700">{publication.número}</p>
          </div>
          {publication.redirectionLink && (
            <div>
              <p className="text-xs text-gray-500 uppercase mb-2">Flipbook</p>
              <a
                href={publication.redirectionLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Open flipbook →
              </a>
            </div>
          )}
        </div>
      </div>
    </PageContentSection>
  );
}
