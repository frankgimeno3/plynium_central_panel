"use client";

import React, { FC } from "react";
import type { PlannedPublicationDetailRow } from "./types";

type Props = {
  publication: PlannedPublicationDetailRow;
};

export const PlannedPublicationDetailSummaryGrid: FC<Props> = ({ publication }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <div>
        <p className="text-xs text-gray-500 uppercase">ID</p>
        <p className="font-medium">{publication.id_publication}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">Edition name</p>
        <p className="font-medium">{publication.edition_name ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">Theme</p>
        <p className="font-medium">{publication.theme ?? "—"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">Publication date</p>
        <p className="font-medium">{publication.publication_date ?? "—"}</p>
      </div>
    </div>
  );
};
