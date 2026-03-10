"use client";

import { FC, useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/PageContentSection";
import { PublicationService } from "@/app/service/PublicationService";
import PublicationSearchClient from "./PublicationSearchClient";
import { buildPublicationSearchHeading } from "./PublicationSearchClient";

const PublicationSearchResultsContent: FC = () => {
  const searchParams = useSearchParams();
  const [filteredPublications, setFilteredPublications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadAndFilterPublications = async () => {
      try {
        setLoading(true);
        
        // Get filters from URL params
        const currentFilters: Record<string, string> = {};
        const revistaParam = searchParams.get('revista');
        const numeroParam = searchParams.get('numero');
        const dateFromParam = searchParams.get('dateFrom');
        const dateToParam = searchParams.get('dateTo');
        const portalNamesParam = searchParams.get('portalNames');

        if (revistaParam) currentFilters.revista = revistaParam;
        if (numeroParam) currentFilters.numero = numeroParam;
        if (dateFromParam) currentFilters.dateFrom = dateFromParam;
        if (dateToParam) currentFilters.dateTo = dateToParam;
        if (portalNamesParam) currentFilters.portalNames = portalNamesParam;

        setFilters(currentFilters);

        const portalNames = portalNamesParam
          ? portalNamesParam.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        // Get publications from API (optionally filtered by portal)
        const apiPublications = await PublicationService.getAllPublications(
          portalNames.length > 0 ? { portalNames } : {}
        );
        const allPublications = Array.isArray(apiPublications) ? apiPublications : [];

        // Filter publications based on search params
        const filtered = allPublications.filter((pub: any) => {
          // Filter by revista
          if (currentFilters.revista && pub.revista !== currentFilters.revista) {
            return false;
          }

          // Filter by número (using 'numero' in URL to avoid encoding issues)
          if (currentFilters.numero && String(pub.número) !== currentFilters.numero) {
            return false;
          }

          // Filter by date range (from)
          if (currentFilters.dateFrom) {
            const [fromYear, fromMonth] = currentFilters.dateFrom.split('-');
            if (!fromYear || !fromMonth) return false;
            
            try {
              const pubDate = new Date(pub.date);
              if (isNaN(pubDate.getTime())) return false;
              
              const pubYear = String(pubDate.getFullYear());
              const pubMonth = String(pubDate.getMonth() + 1).padStart(2, '0');
              
              const fromDate = new Date(parseInt(fromYear), parseInt(fromMonth) - 1, 1);
              const pubDateObj = new Date(parseInt(pubYear), parseInt(pubMonth) - 1, 1);
              
              if (pubDateObj < fromDate) return false;
            } catch (e) {
              return false;
            }
          }

          // Filter by date range (to)
          if (currentFilters.dateTo) {
            const [toYear, toMonth] = currentFilters.dateTo.split('-');
            if (!toYear || !toMonth) return false;
            
            try {
              const pubDate = new Date(pub.date);
              if (isNaN(pubDate.getTime())) return false;
              
              const pubYear = String(pubDate.getFullYear());
              const pubMonth = String(pubDate.getMonth() + 1).padStart(2, '0');
              
              // Get last day of the month for "to"
              const toDate = new Date(parseInt(toYear), parseInt(toMonth), 0);
              const pubDateObj = new Date(parseInt(pubYear), parseInt(pubMonth) - 1, pubDate.getDate());
              
              if (pubDateObj > toDate) return false;
            } catch (e) {
              return false;
            }
          }

          return true;
        });

        setFilteredPublications(filtered);
      } catch (error) {
        console.error("Error loading and filtering publications:", error);
        setFilteredPublications([]);
      } finally {
        setLoading(false);
      }
    };

    loadAndFilterPublications();
  }, [searchParams]);

  const breadcrumbs = [
    { label: "Contents", href: "/logged/pages/network/contents/articles" },
    { label: "Publications", href: "/logged/pages/network/contents/publications" },
    { label: "Search results" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: loading ? "Cargando..." : buildPublicationSearchHeading(filters),
      breadcrumbs,
    });
  }, [loading, filters, setPageMeta]);

  if (loading) {
    return (
      <PageContentSection><p className="text-gray-500">Cargando...</p></PageContentSection>
    );
  }

  return (
    <PublicationSearchClient
      filteredPublications={filteredPublications}
      filters={filters}
      renderLayout={(_heading, filterNode, contentNode) => (
        <>
          <PageContentSection>
            {filterNode}
          </PageContentSection>
          <PageContentSection>
            {contentNode}
          </PageContentSection>
        </>
      )}
    />
  );
};

interface PageProps {
  searchParams: Promise<{
    revista?: string;
    numero?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

const PublicationSearchFallback: FC = () => {
  const { setPageMeta } = usePageContent();
  const breadcrumbs = [
    { label: "Contents", href: "/logged/pages/network/contents/publications" },
    { label: "Publications", href: "/logged/pages/network/contents/publications" },
    { label: "Search results" },
  ];
  useEffect(() => {
    setPageMeta({ pageTitle: "Cargando...", breadcrumbs });
  }, [setPageMeta]);
  return <PageContentSection><p className="text-gray-500">Cargando...</p></PageContentSection>;
};

const PublicationSearchResults: FC<PageProps> = ({ }) => {
  return (
    <Suspense fallback={<PublicationSearchFallback />}>
      <PublicationSearchResultsContent />
    </Suspense>
  );
};

export default PublicationSearchResults;



