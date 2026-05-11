"use client";

import React, { useMemo, useState } from "react";
import type { Newsletter, NewsletterCampaign, NewsletterContentBlock } from "@/app/contents/interfaces";
import type { NewsletterCampaignLayoutConfig } from "@/app/contents/newsletterCampaignLayout";
import { NewsletterComposedView } from "../../components/NewsletterComposedView";
import {
  mapBlocksToContentItems,
  resolveEffectiveNewsletterLayout,
} from "../../utils/newsletterLayoutModel";
import { EditionTab } from "./contentsManager/EditionTab";
import { SpecificContentsTab } from "./contentsManager/SpecificContentsTab";

type ContentsManagerTabProps = {
  newsletter: Newsletter;
  campaign: NewsletterCampaign | null;
  blocks: NewsletterContentBlock[];
  editionLayoutConfig: NewsletterCampaignLayoutConfig;
  onEditionLayoutChange: (config: NewsletterCampaignLayoutConfig) => void;
  onBlocksChange: (blocks: NewsletterContentBlock[]) => void;
  onNewsletterUpdated: (newsletter: Newsletter) => void;
};

type ContentsSubTabId = "currentHtml" | "edition" | "specificContents";

export function ContentsManagerTab({
  newsletter,
  campaign,
  blocks,
  editionLayoutConfig,
  onEditionLayoutChange,
  onBlocksChange,
  onNewsletterUpdated,
}: ContentsManagerTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<ContentsSubTabId>("currentHtml");

  const layout = useMemo(
    () => resolveEffectiveNewsletterLayout(campaign, newsletter),
    [campaign, newsletter]
  );
  const contentItems = useMemo(() => mapBlocksToContentItems(blocks), [blocks]);

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSubTab("currentHtml")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === "currentHtml"
              ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Current HTML newsletter view
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("edition")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === "edition"
              ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Edition
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("specificContents")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === "specificContents"
              ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          }`}
        >
          Specific contents
        </button>
      </div>

      {activeSubTab === "currentHtml" ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Current HTML newsletter view</h3>
            <p className="text-sm text-gray-500">
              Preview based on the campaign layout template and this newsletter&apos;s edition overrides.
            </p>
          </div>
          <NewsletterComposedView config={layout} contentItems={contentItems} />
        </div>
      ) : null}

      {activeSubTab === "edition" ? (
        <EditionTab
          newsletter={newsletter}
          campaign={campaign}
          blocks={blocks}
          config={editionLayoutConfig}
          onConfigChange={onEditionLayoutChange}
          onNewsletterUpdated={onNewsletterUpdated}
        />
      ) : null}

      {activeSubTab === "specificContents" ? (
        <SpecificContentsTab
          newsletterId={newsletter.id}
          blocks={blocks}
          onBlocksChange={onBlocksChange}
        />
      ) : null}
    </div>
  );
}
