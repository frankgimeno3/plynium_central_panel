"use client";

import React from "react";
import type { DataTabProps } from "./data_tab_components/types";
import { DataCoverMarginArticlesSection } from "./data_tab_components/DataCoverMarginArticlesSection";
import { DataCoverPreviewColumn } from "./data_tab_components/DataCoverPreviewColumn";
import { DataPreferentialPlacementsSection } from "./data_tab_components/DataPreferentialPlacementsSection";
import { DataPublicationMetadataForm } from "./data_tab_components/DataPublicationMetadataForm";
import { DataSaveErrorAlert } from "./data_tab_components/DataSaveErrorAlert";

/**
 * Editable "Data" tab: publication metadata form + preferential placements
 * grid + cover margin miniatures table + the cover preview composition.
 *
 * State and side effects (autosave, modals, slot mutations) live in the
 * parent component. The tab only renders and forwards user intent.
 */
export function DataTab({
  publicationId,
  publication,
  draftPub,
  setDraftPub,
  saveError,
  magazine,
  preferentialSlots,
  title,
  coverSlotId,
  coverMarginMiniatures,
  setCoverMarginArticleModalPosition,
  removeCoverMarginArticle,
  startEditingCoverMarginContent,
  updateCoverMarginDraftContent,
  saveCoverMarginDraftContent,
  setMoveContentTypeModal,
}: DataTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-3">
        <DataSaveErrorAlert saveError={saveError} />
        <DataPublicationMetadataForm
          publication={publication}
          draftPub={draftPub}
          setDraftPub={setDraftPub}
        />
        <DataPreferentialPlacementsSection
          preferentialSlots={preferentialSlots}
          setMoveContentTypeModal={setMoveContentTypeModal}
        />
        <DataCoverMarginArticlesSection
          coverMarginMiniatures={coverMarginMiniatures}
          setCoverMarginArticleModalPosition={setCoverMarginArticleModalPosition}
          removeCoverMarginArticle={removeCoverMarginArticle}
          startEditingCoverMarginContent={startEditingCoverMarginContent}
          updateCoverMarginDraftContent={updateCoverMarginDraftContent}
          saveCoverMarginDraftContent={saveCoverMarginDraftContent}
        />
      </div>

      <DataCoverPreviewColumn
        publicationId={publicationId}
        magazine={magazine}
        draftPub={draftPub}
        setDraftPub={setDraftPub}
        title={title}
        coverSlotId={coverSlotId}
        coverMarginMiniatures={coverMarginMiniatures}
      />
    </div>
  );
}
