"use client";

import React, { FC, use, useState, useEffect } from "react";
import Link from "next/link";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { getMediaById } from "@/app/service/mediatecaService";

type ApiMediaItem = { id: string; name: string; s3Key: string; url?: string; folderPath: string; contentType?: string };

function buildAssetSrc(item: ApiMediaItem): string {
  const cloudFront = process.env.NEXT_PUBLIC_CLOUDFRONT_URL;
  const baseUrl = cloudFront ? `https://${String(cloudFront).replace(/^https?:\/\//, "")}` : "";
  return item.url || (baseUrl ? `${baseUrl}/${item.s3Key}` : item.s3Key);
}

function isPdf(item: ApiMediaItem): boolean {
  if (item.contentType === "application/pdf") return true;
  return item.name.toLowerCase().endsWith(".pdf");
}

const MediatecaAssetPage: FC<{ params: Promise<{ id: string }> }> = ({ params }) => {
  const { id } = use(params);
  const [content, setContent] = useState<ApiMediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getMediaById(id)
      .then((data) => {
        if (!cancelled && data) setContent(data);
        if (!cancelled && !data) setNotFound(true);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-gray-900 flex flex-col items-center justify-center">
        <p className="text-gray-400">Loading…</p>
        <Link href="/logged/pages/mediateca" className="text-blue-300 hover:text-white mt-4 text-sm">
          Back to Mediateca
        </Link>
      </div>
    );
  }

  if (notFound || !content) {
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

  const assetUrl = buildAssetSrc(content);
  const isPdfType = isPdf(content);

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
        {isPdfType ? (
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
