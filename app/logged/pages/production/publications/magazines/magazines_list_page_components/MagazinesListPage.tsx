"use client";

import React, { FC, useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { MagazineService } from "@/app/service/MagazineService";
import { Magazine } from "@/app/contents/interfaces";

import { ITEMS_PER_PAGE, MAGAZINES_BASE } from "./magazines_list_components/constants";
import { MagazinesFetchErrorBanner } from "./magazines_list_components/MagazinesFetchErrorBanner";
import { MagazinesFilterForm, type MagazineListFilter } from "./magazines_list_components/MagazinesFilterForm";
import { MagazinesTable } from "./magazines_list_components/MagazinesTable";
import { MagazinesPagination } from "./magazines_list_components/MagazinesPagination";

const MagazinesListPage: FC = () => {
  const router = useRouter();
  const [all, setAll] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MagazineListFilter>({ id: "", name: "" });

  const loadMagazines = useCallback(() => {
    setFetchError(null);
    setLoading(true);
    MagazineService.getAllMagazines()
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : data && Array.isArray((data as { data?: unknown }).data)
            ? (data as { data: Magazine[] }).data
            : [];
        setAll(list);
      })
      .catch((err) => {
        const message = err?.message ?? (typeof err === "string" ? err : "Failed to load magazines");
        setFetchError(message);
        setAll([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadMagazines();
  }, [loadMagazines]);

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) list = list.filter((m) => m.id_magazine.toLowerCase().includes(filter.id.toLowerCase()));
    if (filter.name) list = list.filter((m) => m.name?.toLowerCase().includes(filter.name.toLowerCase()));
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const breadcrumbs = [
    { label: "Production", href: "/logged/pages/production/services" },
    { label: "Publications", href: "/logged/pages/production/publications/magazines" },
    { label: "Magazine titles" },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({
      pageTitle: "Magazine titles",
      breadcrumbs,
      buttons: [
        { label: "Create magazine", href: "/logged/pages/production/publications/magazines/create" },
        { label: "Issue Bulk Creation", href: "/logged/pages/production/publications/issues/bulk-creation" },
      ],
    });
  }, [setPageMeta]);

  if (loading && all.length === 0 && !fetchError) {
    return (
      <PageContentSection>
        <div className="p-6 text-center text-gray-500">Loading magazines…</div>
      </PageContentSection>
    );
  }

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          {fetchError && <MagazinesFetchErrorBanner message={fetchError} onRetry={loadMagazines} />}
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <MagazinesFilterForm filter={filter} onFilterChange={setFilter} onResetPage={() => setPage(1)} />

              <MagazinesTable magazines={paginated} basePath={MAGAZINES_BASE} onRowNavigate={(path) => router.push(path)} />

              {(filtered.length > ITEMS_PER_PAGE || totalPages > 1) && (
                <MagazinesPagination
                  start={start}
                  pageSize={ITEMS_PER_PAGE}
                  filteredCount={filtered.length}
                  page={page}
                  totalPages={totalPages}
                  onPrev={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                />
              )}
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default MagazinesListPage;
