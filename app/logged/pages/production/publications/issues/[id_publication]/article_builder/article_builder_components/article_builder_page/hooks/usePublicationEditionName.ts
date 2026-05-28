"use client";

import { useEffect, useState } from "react";

export function usePublicationEditionName(publicationId: string | null | undefined) {
  const [editionName, setEditionName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!publicationId) {
      setEditionName(null);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await fetch(
          `/api/v1/publications-db/${encodeURIComponent(publicationId)}`,
          { cache: "no-store", credentials: "include" }
        );
        if (!res.ok) {
          if (!cancelled) setEditionName(null);
          return;
        }
        const json = (await res.json()) as { publication_edition_name?: string };
        if (!cancelled) {
          setEditionName(String(json?.publication_edition_name ?? "").trim() || null);
        }
      } catch {
        if (!cancelled) setEditionName(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicationId]);

  return editionName;
}

