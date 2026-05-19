"use client";

import React, { FC } from "react";
import type { PublicationRow } from "../../magazine_detail_components/types";
import { MagazineForecastedPublicationsPanel } from "./magazine_forecasted_publications_tab_components/MagazineForecastedPublicationsPanel";

type Props = {
  publications: PublicationRow[];
};

export const MagazineForecastedPublicationsTab: FC<Props> = ({ publications }) => (
  <MagazineForecastedPublicationsPanel publications={publications} />
);
