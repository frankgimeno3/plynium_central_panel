"use client";

import React, { FC } from "react";
import Link from "next/link";
import { PREFERENTIAL_PAGES_BASE, PUBLICATIONS_BASE } from "../preferential_publication_constants";
import type { PublicationSummary } from "../preferential_publication_types";

type PreferentialPublicationDetailHeaderProps = {
  publication: PublicationSummary;
};

export const PreferentialPublicationDetailHeader: FC<PreferentialPublicationDetailHeaderProps> = ({
  publication,
}) => (
  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
    <div>
      <h1 className="text-xl font-semibold text-gray-900">
        {publication.publication_edition_name || publication.publication_id}
      </h1>
      <p className="font-mono text-xs text-gray-500">{publication.publication_id}</p>
      <p className="text-sm text-gray-600">Status: {publication.publication_status || "—"}</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Link
        href={PREFERENTIAL_PAGES_BASE}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Back to preferential pages
      </Link>
      <Link
        href={`${PUBLICATIONS_BASE}/issues/${encodeURIComponent(publication.publication_id)}`}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Open publication issue
      </Link>
    </div>
  </div>
);
