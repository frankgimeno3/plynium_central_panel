"use client";

import React, { FC } from "react";
import type { PublicationRow, PublicationsListSubTab } from "./types";
import { MagazineForecastedPublicationsTab } from "../_tabs/MagazineForecastedPublicationsTab";
import { MagazineExpiredPublicationsTab } from "../_tabs/MagazineExpiredPublicationsTab";
import { MagazinePublicationsTabNav } from "./magazine_publications_components/MagazinePublicationsTabNav";

type Props = {
  publicationsTab: PublicationsListSubTab;
  forecastedPublications: PublicationRow[];
  expiredPublications: PublicationRow[];
  onPublicationsTabChange: (tab: PublicationsListSubTab) => void;
};

export const MagazinePublicationsSection: FC<Props> = ({
  publicationsTab,
  forecastedPublications,
  expiredPublications,
  onPublicationsTabChange,
}) => (
  <div className="mt-6 bg-white rounded-b-lg overflow-hidden border border-gray-200 border-t-0">
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Publications</h2>
      <p className="text-sm text-gray-600 mb-3">Data from publications_db for this magazine.</p>
      <MagazinePublicationsTabNav
        publicationsTab={publicationsTab}
        onPublicationsTabChange={onPublicationsTabChange}
      />
      <div
        role="tabpanel"
        aria-labelledby={
          publicationsTab === "forecasted" ? "mag-pubs-tab-forecasted" : "mag-pubs-tab-expired"
        }
      >
        {publicationsTab === "forecasted" ? (
          <MagazineForecastedPublicationsTab publications={forecastedPublications} />
        ) : (
          <MagazineExpiredPublicationsTab publications={expiredPublications} />
        )}
      </div>
    </div>
  </div>
);
