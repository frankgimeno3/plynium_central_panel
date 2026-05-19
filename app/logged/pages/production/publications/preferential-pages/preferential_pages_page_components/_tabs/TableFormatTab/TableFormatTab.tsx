"use client";

import React, { FC } from "react";
import type { PortalRow, PendingPreferentialSlotRow } from "../../preferential_pages_types";
import { TableFormatFilters } from "./table_format_tab_components/TableFormatFilters";
import { PendingPreferentialSlotsTable } from "./table_format_tab_components/PendingPreferentialSlotsTable";

type TableFormatFilterState = {
  portal_id: string;
  magazine_id: string;
  publication_id: string;
  publication_name: string;
  service_group_id: string;
};

export type TableFormatTabProps = {
  portals: PortalRow[];
  tableFilter: TableFormatFilterState;
  setTableFilter: React.Dispatch<React.SetStateAction<TableFormatFilterState>>;
  tableRows: PendingPreferentialSlotRow[];
  tableLoading: boolean;
  tableError: string | null;
  onRefresh: () => void;
};

export const TableFormatTab: FC<TableFormatTabProps> = ({
  portals,
  tableFilter,
  setTableFilter,
  tableRows,
  tableLoading,
  tableError,
  onRefresh,
}) => (
  <div className="space-y-4 p-4">
    <TableFormatFilters portals={portals} tableFilter={tableFilter} setTableFilter={setTableFilter} />

    <div className="flex justify-end">
      <button
        type="button"
        onClick={() => void onRefresh()}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Refresh
      </button>
    </div>

    {tableError ? (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        {tableError}
      </p>
    ) : null}

    <PendingPreferentialSlotsTable tableLoading={tableLoading} tableRows={tableRows} />
  </div>
);
