"use client";

import React, { FC, useEffect, useMemo, useState } from "react";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import { useCompanyRequests } from "@/app/logged/pages/network/requests/hooks/useCompanyRequests";
import { useOtherRequests } from "@/app/logged/pages/network/requests/hooks/useOtherRequests";
import { useAdvertisements } from "@/app/logged/pages/network/requests/hooks/useAdvertisements";
import CompanyCreationRequestsTab from "./components/CompanyCreationRequestsTab";
import AdvertisementQuotationsTab from "./components/AdvertisementQuotationsTab";
import OtherCommunicationsTab from "./components/OtherCommunicationsTab";
 
type TabKey = "company" | "quotations" | "other";

const tabs: { key: TabKey; label: string }[] = [
  { key: "company", label: "Company Creation Requests" },
  { key: "quotations", label: "Advertisement quotations" },
  { key: "other", label: "Other Communications" },
];

const CommunicationsPage: FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("company");
  const { setPageMeta } = usePageContent();

  const { requests: companyRequests } = useCompanyRequests();
  const { requests: otherRequests } = useOtherRequests();
  const { counts: advCounts } = useAdvertisements();

  const pendingByTab = useMemo(
    () => ({
      company: companyRequests.filter((r) => r.request_state === "Pending").length,
      quotations: advCounts.pending,
      other: otherRequests.filter((r) => r.request_state === "Pending").length,
    }),
    [companyRequests, otherRequests, advCounts.pending]
  );

  useEffect(() => {
    setPageMeta({
      pageTitle: "Communications",
      breadcrumbs: [{ label: "Communications" }],
      buttons: [],
    });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200 ">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors
                  ${
                    activeTab === tab.key
                      ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                {tab.label}
                {pendingByTab[tab.key] > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            {activeTab === "company" && <CompanyCreationRequestsTab />}
            {activeTab === "quotations" && <AdvertisementQuotationsTab />}
            {activeTab === "other" && <OtherCommunicationsTab />}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default CommunicationsPage;
