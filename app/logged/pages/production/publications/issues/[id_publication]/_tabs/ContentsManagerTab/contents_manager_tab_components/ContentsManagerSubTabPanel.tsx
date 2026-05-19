"use client";

import type { ContentsManagerSubTabId } from "./types";
import { AvailableArticlesPanel } from "./panels/AvailableArticlesPanel";
import { SelectedContentsPanel } from "./panels/SelectedContentsPanel";
import { ShouldBeInMagazinePanel } from "./panels/ShouldBeInMagazinePanel";

type ContentsManagerSubTabPanelProps = {
  activeSubTab: ContentsManagerSubTabId;
  publicationId: string;
};

export function ContentsManagerSubTabPanel({
  activeSubTab,
  publicationId,
}: ContentsManagerSubTabPanelProps) {
  if (activeSubTab === "should_be_in_magazine") {
    return <ShouldBeInMagazinePanel publicationId={publicationId} />;
  }

  if (activeSubTab === "selected_contents") {
    return <SelectedContentsPanel publicationId={publicationId} />;
  }

  return <AvailableArticlesPanel publicationId={publicationId} />;
}
