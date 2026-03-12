"use client";

import { FC, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import publicationsData from "@/app/contents/publications.json";
import { publicationInterface } from "@/app/contents/interfaces";

const BASE = "/logged/pages/production/publications/published";
const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?q=80&w=2340&auto=format&fit=crop";

const applyFilters = (
  list: publicationInterface[],
  dateFrom: string,
  dateTo: string,
  tag: string,
  selectedRevista: string
): publicationInterface[] => {
  let result = list;
  if (selectedRevista) result = result.filter((p) => p.revista === selectedRevista);
  if (dateFrom) {
    const [fromYear, fromMonth] = dateFrom.split("-");
    if (fromYear && fromMonth) {
      const fromDate = new Date(parseInt(fromYear, 10), parseInt(fromMonth, 10) - 1, 1);
      result = result.filter((p) => {
        const d = new Date(p.date);
        if (isNaN(d.getTime())) return false;
        const pubStart = new Date(d.getFullYear(), d.getMonth(), 1);
        return pubStart >= fromDate;
      });
    }
  }
  if (dateTo) {
    const [toYear, toMonth] = dateTo.split("-");
    if (toYear && toMonth) {
      const toDate = new Date(parseInt(toYear, 10), parseInt(toMonth, 10), 0);
      result = result.filter((p) => {
        const d = new Date(p.date);
        if (isNaN(d.getTime())) return false;
        return d <= toDate;
      });
    }
  }
  if (tag.trim()) {
    const tagLower = tag.trim().toLowerCase();
    result = result.filter(
      (p) =>
        (p.revista && String(p.revista).toLowerCase().includes(tagLower)) ||
        (p.número !== undefined && String(p.número).toLowerCase().includes(tagLower))
    );
  }
  return result;
};

const PublishedPage: FC = () => {
  const all = (publicationsData as publicationInterface[]).slice();
  const [selectedRevista, setSelectedRevista] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [tag, setTag] = useState("");

  const uniqueRevistas = useMemo(() => {
    const revistas = new Set<string>();
    all.forEach((p) => {
      if (p.revista) revistas.add(p.revista);
    });
    return Array.from(revistas).sort();
  }, [all]);

  const filteredPublications = useMemo(
    () => applyFilters(all, dateFrom, dateTo, tag, selectedRevista),
    [all, dateFrom, dateTo, tag, selectedRevista]
  );

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Publications", href: "/logged/pages/production/publications/magazines" },
    { label: "Published Issues" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Published Issues",
      breadcrumbs,
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Publications filter</h2>
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date from (YYYY-MM)</label>
                    <input
                      type="text"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      placeholder="e.g. 2024-01"
                      className="w-full max-w-[140px] rounded-md border border-gray-300 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Date to (YYYY-MM)</label>
                    <input
                      type="text"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      placeholder="e.g. 2025-12"
                      className="w-full max-w-[140px] rounded-md border border-gray-300 p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tag</label>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="Type a tag…"
                      className="w-full max-w-xs rounded-md border border-gray-300 p-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">Published issues</h2>
              <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRevista("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedRevista === "" ? "bg-blue-950 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All magazines
          </button>
          {uniqueRevistas.map((rev) => (
            <button
              key={rev}
              type="button"
              onClick={() => setSelectedRevista(rev)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedRevista === rev ? "bg-blue-950 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {rev}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap py-5 gap-12 justify-center">
          {filteredPublications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 w-full">
              <p className="text-gray-500 text-lg">No results found for your query</p>
            </div>
          ) : (
            filteredPublications.map((pub, index) => (
              <Link
                key={pub.id_publication ?? index}
                href={`${BASE}/${pub.id_publication}`}
                className="flex flex-col shadow-xl w-80 p-2 border-t border-gray-100 bg-gray-100/50 hover:bg-white min-h-[500px] cursor-pointer"
              >
                <div className="w-full h-60 bg-gray-300 overflow-hidden rounded-t-lg">
                  <img
                    src={
                      pub.publication_main_image_url && pub.publication_main_image_url.trim() !== ""
                        ? pub.publication_main_image_url
                        : DEFAULT_IMAGE
                    }
                    alt={`${pub.revista} - ${pub.número}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== DEFAULT_IMAGE) target.src = DEFAULT_IMAGE;
                    }}
                  />
                </div>
                <div className="flex flex-col p-3 flex-grow">
                  <p className="font-semibold line-clamp-4">
                    {pub.revista} - {pub.número}
                  </p>
                  <p className="text-sm text-gray-400 italic pt-2">{pub.date}</p>
                  <div className="flex flex-row flex-wrap gap-2 pt-4">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{pub.revista}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{pub.número}</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default PublishedPage;
