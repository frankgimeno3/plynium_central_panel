"use client";

import React, { FC } from "react";
import type { CampaignRow, FormState, GeneralServiceRow, MagazineRow, PortalRow, PublicationRow } from "./create_service_types";
import { CreateServiceDemFields } from "./CreateServiceDemFields";
import { CreateServiceMagazineFields } from "./CreateServiceMagazineFields";
import { CreateServicePortalFields } from "./CreateServicePortalFields";

type CreateServiceStepCustomFieldsProps = {
  form: FormState;
  selectedParent: GeneralServiceRow | null;
  portals: PortalRow[];
  magazines: MagazineRow[];
  campaignsForPortal: CampaignRow[];
  magazinePublications: PublicationRow[];
  magazinePublicationYears: number[];
  publicationsForMagazineYear: PublicationRow[];
  canAdvanceStep2: boolean;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setCampaignsForPortal: React.Dispatch<React.SetStateAction<CampaignRow[]>>;
  setMagazinePublications: React.Dispatch<React.SetStateAction<PublicationRow[]>>;
  onBack: () => void;
  onNext: () => void;
};

export const CreateServiceStepCustomFields: FC<CreateServiceStepCustomFieldsProps> = ({
  form,
  selectedParent,
  portals,
  magazines,
  campaignsForPortal,
  magazinePublications,
  magazinePublicationYears,
  publicationsForMagazineYear,
  canAdvanceStep2,
  setForm,
  setCampaignsForPortal,
  setMagazinePublications,
  onBack,
  onNext,
}) => {
  if (!form.custom) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm font-semibold text-gray-700 mb-1">Selection</p>
        <p className="text-xs text-gray-500 mt-1">
          Channel: {form.custom.channel} · General service: {selectedParent?.service_full_name ?? "—"}
        </p>
      </div>

      {form.custom.channel === "dem" && (
        <CreateServiceDemFields
          custom={form.custom}
          portals={portals}
          campaignsForPortal={campaignsForPortal}
          setForm={setForm}
          setCampaignsForPortal={setCampaignsForPortal}
        />
      )}

      {form.custom.channel === "portal" && (
        <CreateServicePortalFields custom={form.custom} portals={portals} setForm={setForm} />
      )}

      {form.custom.channel === "magazine" && (
        <CreateServiceMagazineFields
          custom={form.custom}
          magazines={magazines}
          magazinePublications={magazinePublications}
          magazinePublicationYears={magazinePublicationYears}
          publicationsForMagazineYear={publicationsForMagazineYear}
          setForm={setForm}
          setMagazinePublications={setMagazinePublications}
        />
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canAdvanceStep2}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Description
        </button>
      </div>
    </div>
  );
};
