"use client";

import { FC, Suspense, useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";

import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import PublicationFilter, {
  PublicationFilterParams,
} from "./publication_components/PublicationFilter";
import { PublicationService } from "@/app/service/PublicationService";

interface PublicationsProps {}

const applyFilters = (
  list: any[],
  params: PublicationFilterParams,
  selectedRevista: string
): any[] => {
  let result = list;

  if (selectedRevista) {
    result = result.filter((pub: any) => pub.revista === selectedRevista);
  }

  if (params.dateFrom) {
    const [fromYear, fromMonth] = params.dateFrom.split("-");
    if (fromYear && fromMonth) {
      const fromDate = new Date(
        parseInt(fromYear, 10),
        parseInt(fromMonth, 10) - 1,
        1
      );
      result = result.filter((pub: any) => {
        const d = new Date(pub.date);
        if (isNaN(d.getTime())) return false;
        const pubStart = new Date(d.getFullYear(), d.getMonth(), 1);
        return pubStart >= fromDate;
      });
    }
  }

  if (params.dateTo) {
    const [toYear, toMonth] = params.dateTo.split("-");
    if (toYear && toMonth) {
      const toDate = new Date(
        parseInt(toYear, 10),
        parseInt(toMonth, 10),
        0
      );
      result = result.filter((pub: any) => {
        const d = new Date(pub.date);
        if (isNaN(d.getTime())) return false;
        return d <= toDate;
      });
    }
  }

  if (params.tag.trim()) {
    const tagLower = params.tag.trim().toLowerCase();
    result = result.filter(
      (pub: any) =>
        (pub.revista && String(pub.revista).toLowerCase().includes(tagLower)) ||
        (pub.número !== undefined &&
          String(pub.número).toLowerCase().includes(tagLower))
    );
  }

  return result;
};

const Publications: FC<PublicationsProps> = ({}) => {
  const [allPublications, setAllPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRevista, setSelectedRevista] = useState("");
  const [filterParams, setFilterParams] = useState<PublicationFilterParams>({
    dateFrom: "",
    dateTo: "",
    tag: "",
  });

  const fetchPublications = useCallback(async () => {
    try {
      const apiPublications = await PublicationService.getAllPublications();
      setAllPublications(Array.isArray(apiPublications) ? apiPublications : []);
    } catch (error) {
      console.error("Error fetching publications:", error);
      setAllPublications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPublications();
  }, [fetchPublications]);

  const uniqueRevistas = useMemo(() => {
    const revistas = new Set<string>();
    allPublications.forEach((pub: any) => {
      if (pub.revista) revistas.add(pub.revista);
    });
    return Array.from(revistas).sort();
  }, [allPublications]);

  const filteredPublications = useMemo(
    () => applyFilters(allPublications, filterParams, selectedRevista),
    [allPublications, filterParams, selectedRevista]
  );

  const breadcrumbs = [{ label: "Publications" }];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "All publications",
      breadcrumbs,
      buttons: [
        {
          label: "Create publication",
          href: "/logged/pages/network/contents/publications/create_publication",
        },
        {
          label: "Create magazine",
          href: "/logged/pages/network/contents/publications/create_magazine",
        },
      ],
    });
  }, [setPageMeta, breadcrumbs]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Publications Filter
              </h2>
              <Suspense
                fallback={
                  <div className="py-2 text-xs text-gray-500">
                    Loading filter...
                  </div>
                }
              >
                <PublicationFilter
                  initialParams={filterParams}
                  onFilter={setFilterParams}
                />
              </Suspense>

              <h2 className="text-xl font-semibold text-gray-900 mb-4 mt-8">
                Publications list
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedRevista("")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedRevista === ""
                ? "bg-blue-950 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
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
                selectedRevista === rev
                  ? "bg-blue-950 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {rev}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap py-5 gap-12 justify-center">
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">Loading publications...</p>
            </div>
          ) : filteredPublications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 w-full">
              <p className="text-gray-500 text-lg">
                No results found for your query
              </p>
            </div>
          ) : (
            filteredPublications.map((pub: any, index: number) => (
              <Link
                key={pub.id_publication ?? index}
                href={`/logged/pages/network/contents/publications/${pub.id_publication}`}
                className="flex flex-col shadow-xl w-80 p-2 border-t border-gray-100 bg-gray-100/50 hover:bg-white min-h-[500px] cursor-pointer"
              >
                <div className="w-full h-60 bg-gray-300 overflow-hidden rounded-t-lg">
                  <img
                    src={
                      pub.publication_main_image_url &&
                      pub.publication_main_image_url.trim() !== ""
                        ? pub.publication_main_image_url
                        : "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    }
                    alt={`${pub.revista} - ${pub.número}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (
                        target.src !==
                        "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                      ) {
                        target.src =
                          "https://images.unsplash.com/photo-1761839258045-6ef373ab82a7?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
                      }
                    }}
                  />
                </div>

                <div className="flex flex-col p-3 flex-grow">
                  <p className="font-semibold line-clamp-4">
                    {pub.revista} - {pub.número}
                  </p>
                  <p className="text-sm text-gray-400 italic pt-2">
                    {pub.date}
                  </p>
                  <div className="flex flex-row flex-wrap gap-2 pt-4">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {pub.revista}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {pub.número}
                    </span>
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

export default Publications;
