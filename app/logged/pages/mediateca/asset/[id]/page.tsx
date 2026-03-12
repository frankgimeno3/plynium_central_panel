"use client";

import React, { FC, use } from "react";
import Link from "next/link";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import contentsData from "@/app/contents/mediatecaContents.json";

type MediatecaContent = {
  id: string;
  name: string;
  type: "pdf" | "image";
  content_type: "json" | "image";
  url?: string | null;
  src: string;
  thumbnailUrl?: string | null;
};

const contents = contentsData as MediatecaContent[];

const MediatecaAssetPage: FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const { id } = use(params);
  const content = contents.find((c) => c.id === id);

  if (!content) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden p-6 flex flex-col items-center justify-center min-h-[200px]">
            <p className="text-gray-600 mb-4">Asset not found.</p>
            <Link
              href="/logged/pages/mediateca"
              className="text-blue-600 hover:underline font-medium"
            >
              Back to Mediateca
            </Link>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const assetUrl = content.src || (content.content_type === "json" ? "https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf" : "https://picsum.photos/800/600");

  return (
    <div className="fixed inset-0 w-screen h-screen bg-gray-900 flex flex-col">
      <header className="flex items-center justify-between p-4 bg-gray-800 text-white shrink-0">
        <span className="font-medium truncate">{content.name}</span>
        <div className="flex items-center gap-3">
          <a
            href={assetUrl}
            download={content.name}
            className="text-sm text-blue-300 hover:text-white"
          >
            Download
          </a>
          <Link
            href="/logged/pages/mediateca"
            className="text-sm text-blue-300 hover:text-white"
          >
            Back to Mediateca
          </Link>
        </div>
      </header>
      <main className="flex-1 min-h-0 w-full overflow-auto">
        {content.content_type === "json" || content.type === "pdf" ? (
          <iframe
            src={assetUrl}
            title={content.name}
            className="w-full h-full min-h-full border-0 bg-white block"
          />
        ) : (
          <img
            src={assetUrl}
            alt={content.name}
            className="w-full h-full object-contain object-center block"
          />
        )}
      </main>
    </div>
  );
};

export default MediatecaAssetPage;
