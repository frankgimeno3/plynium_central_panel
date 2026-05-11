"use client";

import React, { FC } from "react";
import type { FormState, MagazineRow, PublicationRow } from "./create_service_types";
import { getPublicationEditionLabel } from "./create_service_helpers";

type CreateServiceMagazineFieldsProps = {
  custom: Extract<FormState["custom"], { channel: "magazine" }>;
  magazines: MagazineRow[];
  magazinePublications: PublicationRow[];
  magazinePublicationYears: number[];
  publicationsForMagazineYear: PublicationRow[];
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setMagazinePublications: React.Dispatch<React.SetStateAction<PublicationRow[]>>;
};

export const CreateServiceMagazineFields: FC<CreateServiceMagazineFieldsProps> = ({
  custom,
  magazines,
  magazinePublications,
  magazinePublicationYears,
  publicationsForMagazineYear,
  setForm,
  setMagazinePublications,
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs text-gray-600 mb-1">
        Magazine <span className="text-red-500">*</span>
      </label>
      <select
        value={custom.magazineId}
        onChange={(e) => {
          const mid = e.target.value;
          const m = magazines.find((x) => x.id_magazine === mid);
          setForm((f) => ({
            ...f,
            custom:
              f.custom && f.custom.channel === "magazine"
                ? {
                    ...f.custom,
                    magazineId: mid,
                    magazineName: m?.name ?? "",
                    publicationYear: "",
                    publicationId: "",
                    publicationEditionName: "",
                  }
                : f.custom,
          }));
          setMagazinePublications([]);
        }}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
      >
        <option value="">Select magazine…</option>
        {magazines.map((m) => (
          <option key={m.id_magazine} value={m.id_magazine}>
            {m.name}
          </option>
        ))}
      </select>
    </div>

    {custom.magazineId && (
      <>
        {magazinePublicationYears.length === 0 && magazinePublications.length === 0 ? (
          <p className="text-sm text-gray-500">
            Loading editions… If this persists, this magazine may have no publications yet.
          </p>
        ) : magazinePublicationYears.length === 0 ? (
          <p className="text-sm text-amber-700">
            No editions with a valid publication year were found for this magazine. Check that{" "}
            <span className="font-mono text-xs">publication_year</span> is set in RDS.
          </p>
        ) : (
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Publication year <span className="text-red-500">*</span>
            </label>
            <select
              value={custom.publicationYear}
              onChange={(e) => {
                const year = e.target.value;
                setForm((f) => ({
                  ...f,
                  custom:
                    f.custom && f.custom.channel === "magazine"
                      ? {
                          ...f.custom,
                          publicationYear: year,
                          publicationId: "",
                          publicationEditionName: "",
                        }
                      : f.custom,
                }));
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Select year…</option>
              {magazinePublicationYears.map((y) => (
                <option key={y} value={String(y)}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        )}

        {custom.publicationYear.trim() !== "" && (
          <div>
            <label className="block text-xs text-gray-600 mb-1">
              Publication edition <span className="text-red-500">*</span>
            </label>
            {publicationsForMagazineYear.length === 0 ? (
              <p className="text-sm text-gray-500">No editions for year {custom.publicationYear}.</p>
            ) : (
              <select
                value={custom.publicationId}
                onChange={(e) => {
                  const pid = e.target.value;
                  const p = publicationsForMagazineYear.find((x) => x.id_publication === pid);
                  setForm((f) => ({
                    ...f,
                    custom:
                      f.custom && f.custom.channel === "magazine"
                        ? {
                            ...f.custom,
                            publicationId: pid,
                            publicationEditionName: p ? getPublicationEditionLabel(p) : "",
                          }
                        : f.custom,
                  }));
                }}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
              >
                <option value="">Select edition…</option>
                {publicationsForMagazineYear.map((p) => (
                  <option key={p.id_publication} value={p.id_publication}>
                    {getPublicationEditionLabel(p)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </>
    )}
  </div>
);
