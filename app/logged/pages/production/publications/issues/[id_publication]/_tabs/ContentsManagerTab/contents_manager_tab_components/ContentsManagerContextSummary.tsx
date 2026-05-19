"use client";

import Link from "next/link";
import { PUBLICATIONS_APP_BASE } from "@/app/logged/pages/production/publications/publication_components/_shared";

type ContentsManagerContextSummaryProps = {
  resolvedMagazineId: string | null;
  magazineLabel: string;
  portalsLabel: string;
};

export function ContentsManagerContextSummary({
  resolvedMagazineId,
  magazineLabel,
  portalsLabel,
}: ContentsManagerContextSummaryProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
      <p>
        <span className="font-medium text-gray-700">Magazine:</span>{" "}
        {resolvedMagazineId ? (
          <Link
            href={`${PUBLICATIONS_APP_BASE}/magazines/${encodeURIComponent(resolvedMagazineId)}`}
            className="text-blue-700 hover:underline"
          >
            {magazineLabel}
          </Link>
        ) : (
          "—"
        )}
      </p>
      {resolvedMagazineId ? (
        <p className="mt-1 font-mono text-[11px] text-gray-500">{resolvedMagazineId}</p>
      ) : null}
      <p className="mt-2">
        <span className="font-medium text-gray-700">Portals:</span> {portalsLabel}
      </p>
    </div>
  );
}
