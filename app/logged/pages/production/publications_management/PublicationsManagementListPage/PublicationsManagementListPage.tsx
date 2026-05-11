"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { PublicationService } from "@/app/service/PublicationService";
import { PublicationsManagementListFilters } from "./publications_management_list_components/PublicationsManagementListFilters";
import { PublicationsManagementListPagination } from "./publications_management_list_components/PublicationsManagementListPagination";
import { PublicationsManagementListTable } from "./publications_management_list_components/PublicationsManagementListTable";
import type { PlannedPublication, PublicationsListFilter } from "./publications_management_list_components/types";

const ITEMS_PER_PAGE = 12;

const PublicationsManagementListPage: FC = () => {
  const [all, setAll] = useState<PlannedPublication[]>([]);
  const [filter, setFilter] = useState<PublicationsListFilter>({ id: "", edition: "", theme: "" });

  useEffect(() => {
    PublicationService.getAllPublications()
      .then((list: unknown[]) => {
        const rows = Array.isArray(list) ? list : [];
        setAll(
          rows
            .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
            .map((x) => ({
              id_publication: String(
                x.id_publication ?? x.publication_id ?? x.id ?? ""
              ).trim(),
              edition_name:
                x.edition_name != null ? String(x.edition_name) : undefined,
              theme: x.theme != null ? String(x.theme) : undefined,
              publication_date:
                x.publication_date != null ? String(x.publication_date) : undefined,
            }))
            .filter((p) => p.id_publication.length > 0)
        );
      })
      .catch(() => setAll([]));
  }, []);

  const filtered = useMemo(() => {
    let list = [...all];
    if (filter.id) {
      list = list.filter((p) =>
        p.id_publication.toLowerCase().includes(filter.id.toLowerCase())
      );
    }
    if (filter.edition) {
      list = list.filter((p) =>
        p.edition_name?.toLowerCase().includes(filter.edition.toLowerCase())
      );
    }
    if (filter.theme) {
      list = list.filter((p) => p.theme?.toLowerCase().includes(filter.theme.toLowerCase()));
    }
    return list;
  }, [all, filter]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const start = (page - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

  const breadcrumbs = useMemo(
    () => [
      { label: "Production", href: "/logged/pages/production/services" },
      { label: "Planned Publications" },
    ],
    []
  );

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Planned Publications", breadcrumbs });
  }, [setPageMeta, breadcrumbs]);

  const handleFilterChange = (next: PublicationsListFilter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
              <PublicationsManagementListFilters filter={filter} onFilterChange={handleFilterChange} />
              <PublicationsManagementListTable rows={paginated} />
              <PublicationsManagementListPagination
                start={start}
                page={page}
                totalPages={totalPages}
                filteredLength={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                visible={filtered.length > ITEMS_PER_PAGE || totalPages > 1}
              />
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default PublicationsManagementListPage;
