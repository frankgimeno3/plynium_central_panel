"use client";

import React, { FC } from "react";
import type { PublicationRow } from "../../magazine_detail_components/types";
import { MagazineExpiredPublicationsPanel } from "./magazine_expired_publications_tab_components/MagazineExpiredPublicationsPanel";

type Props = {
  publications: PublicationRow[];
};

export const MagazineExpiredPublicationsTab: FC<Props> = ({ publications }) => (
  <MagazineExpiredPublicationsPanel publications={publications} />
);
