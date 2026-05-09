"use client";

import React, { FC, use, useEffect } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";

const BASE = "/logged/pages/production/publications";

const ArticleEditorPlaceholderPage: FC<{
  params: Promise<{ id_publication: string; slot_id: string; editor_id: string }>;
}> = ({ params }) => {
  const { id_publication, slot_id, editor_id } = use(params);
  const { setPageMeta } = usePageContent();

  useEffect(() => {
    setPageMeta({
      pageTitle: "Article editor",
      breadcrumbs: [
        { label: "Production", href: "/logged/pages/production/services" },
        { label: "Publications", href: `${BASE}/issues` },
        { label: "Issues", href: `${BASE}/issues` },
        { label: id_publication, href: `${BASE}/${encodeURIComponent(id_publication)}` },
        {
          label: `Slot #${slot_id}`,
          href: `${BASE}/${encodeURIComponent(id_publication)}/slots/${encodeURIComponent(slot_id)}`,
        },
        { label: `Article editor: ${editor_id}` },
      ],
      buttons: [
        {
          label: "Back to slot",
          href: `${BASE}/${encodeURIComponent(id_publication)}/slots/${encodeURIComponent(slot_id)}`,
        },
      ],
    });
  }, [setPageMeta, id_publication, slot_id, editor_id]);

  return (
    <PageContentSection>
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-12">
        <div className="max-w-md text-center bg-white border border-gray-200 rounded-2xl shadow-sm p-10">
          <h1 className="text-2xl font-semibold text-gray-900">Page under construction</h1>
          <p className="mt-3 text-sm text-gray-600">
            The magazine article editor (
            <span className="font-mono text-gray-800">{editor_id}</span>) is not available
            yet.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Slot <span className="font-mono">#{slot_id}</span> · Publication
            <span className="font-mono"> {id_publication}</span>
          </p>
          <Link
            href={`${BASE}/${encodeURIComponent(id_publication)}/slots/${encodeURIComponent(slot_id)}`}
            className="mt-6 inline-block px-4 py-2 text-sm font-medium text-white bg-blue-950 rounded-lg hover:bg-blue-950/90"
          >
            Back to slot
          </Link>
        </div>
      </div>
    </PageContentSection>
  );
};

export default ArticleEditorPlaceholderPage;
