"use client";

import { useMemo } from "react";
import type { PublicationRow } from "../types";
import { MagazinePublicationsTable } from "./MagazinePublicationsTable";

type MagazinePublicationsTabBodyProps = {
  publications: PublicationRow[];
};

export function MagazinePublicationsTabBody({ publications }: MagazinePublicationsTabBodyProps) {
  const sorted = useMemo(
    () =>
      publications
        .slice()
        .sort((a, b) => {
          const dateA = a.real_publication_month_date || "";
          const dateB = b.real_publication_month_date || "";
          return dateB.localeCompare(dateA);
        }),
    [publications]
  );

  if (sorted.length === 0) {
    return <p className="text-gray-500">No publications in this tab.</p>;
  }

  return <MagazinePublicationsTable publications={sorted} />;
}
