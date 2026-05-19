"use client";

import React, { FC } from "react";
import type { PortalRow } from "../../../preferential_pages_types";

type TableFormatFilterState = {
  portal_id: string;
  magazine_id: string;
  publication_id: string;
  publication_name: string;
  service_group_id: string;
};

type TableFormatFiltersProps = {
  portals: PortalRow[];
  tableFilter: TableFormatFilterState;
  setTableFilter: React.Dispatch<React.SetStateAction<TableFormatFilterState>>;
};

export const TableFormatFilters: FC<TableFormatFiltersProps> = ({
  portals,
  tableFilter,
  setTableFilter,
}) => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500" htmlFor="preferential-filter-portal">
        Portal
      </label>
      <select
        id="preferential-filter-portal"
        value={tableFilter.portal_id}
        onChange={(event) =>
          setTableFilter((prev) => ({ ...prev, portal_id: event.target.value }))
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">All portals</option>
        {portals.map((portal) => (
          <option key={portal.id} value={String(portal.id)}>
            {portal.name || portal.key}
          </option>
        ))}
      </select>
    </div>
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500" htmlFor="preferential-filter-magazine-id">
        Magazine ID
      </label>
      <input
        id="preferential-filter-magazine-id"
        type="text"
        value={tableFilter.magazine_id}
        onChange={(event) =>
          setTableFilter((prev) => ({ ...prev, magazine_id: event.target.value }))
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Filter by magazine ID"
      />
    </div>
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500" htmlFor="preferential-filter-publication-id">
        Publication ID
      </label>
      <input
        id="preferential-filter-publication-id"
        type="text"
        value={tableFilter.publication_id}
        onChange={(event) =>
          setTableFilter((prev) => ({ ...prev, publication_id: event.target.value }))
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Filter by publication ID"
      />
    </div>
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500" htmlFor="preferential-filter-publication-name">
        Publication name
      </label>
      <input
        id="preferential-filter-publication-name"
        type="text"
        value={tableFilter.publication_name}
        onChange={(event) =>
          setTableFilter((prev) => ({ ...prev, publication_name: event.target.value }))
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Filter by publication name"
      />
    </div>
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wide text-gray-500" htmlFor="preferential-filter-service-group">
        Service group ID
      </label>
      <input
        id="preferential-filter-service-group"
        type="text"
        value={tableFilter.service_group_id}
        onChange={(event) =>
          setTableFilter((prev) => ({ ...prev, service_group_id: event.target.value }))
        }
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        placeholder="Filter by service group ID"
      />
    </div>
  </div>
);
