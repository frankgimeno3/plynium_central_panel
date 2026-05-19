"use client";

import type { PublicationRow } from "../../../magazine_detail_components/types";
import { MagazinePublicationsTabBody } from "../../../magazine_detail_components/magazine_publications_components/MagazinePublicationsTabBody";

type MagazineExpiredPublicationsPanelProps = {
  publications: PublicationRow[];
};

export function MagazineExpiredPublicationsPanel({
  publications,
}: MagazineExpiredPublicationsPanelProps) {
  return <MagazinePublicationsTabBody publications={publications} />;
}
