"use client";

import type { PublicationRow } from "../../../magazine_detail_components/types";
import { MagazinePublicationsTabBody } from "../../../magazine_detail_components/magazine_publications_components/MagazinePublicationsTabBody";

type MagazineForecastedPublicationsPanelProps = {
  publications: PublicationRow[];
};

export function MagazineForecastedPublicationsPanel({
  publications,
}: MagazineForecastedPublicationsPanelProps) {
  return <MagazinePublicationsTabBody publications={publications} />;
}
