"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { usePageContent } from "@/app/logged/logged_components/context_content/PageContentContext";
import PageContentSection from "@/app/logged/logged_components/context_content/PageContentSection";
import {
  fetchNotifications,
  getNotificationsByCategory,
  unifiedToNotification,
  type UnifiedNotification,
} from "@/app/contents/notifications.types";
import { useCompanyRequests } from "@/app/logged/pages/tickets/hooks/useCompanyRequests";
import { useOtherRequests } from "@/app/logged/pages/tickets/hooks/useOtherRequests";
import { useAdvertisements } from "@/app/logged/pages/tickets/hooks/useAdvertisements";
import CompanyTab from "./_tabs/company/CompanyTab";
import QuotationsTab from "./_tabs/quotations/QuotationsTab";
import ProductTab from "./_tabs/product/ProductTab";
import AccountManagementTicketsTab from "./_tabs/account_management/AccountManagementTicketsTab";
import ProductionTicketsTab from "./_tabs/production/ProductionTicketsTab";
import AdministrationTicketsTab from "./_tabs/administration/AdministrationTicketsTab";
import OtherTab from "./_tabs/other/OtherTab";
import type { MappedNotificationRow, NotificationSubTabKey } from "./_tabs/notification_shared/NotificationCategoryTab";

type MainTabKey =
  | "company"
  | "quotations"
  | "product"
  | "account_management"
  | "production"
  | "administration"
  | "other";

const formatNotificationTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const TicketsPage: FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as MainTabKey | null;
  const validTabs: MainTabKey[] = [
    "company",
    "quotations",
    "product",
    "account_management",
    "production",
    "administration",
    "other",
  ];
  const initialTab: MainTabKey = tabParam && validTabs.includes(tabParam) ? tabParam : "company";

  const [currentMainTab, setCurrentMainTab] = useState<MainTabKey>(initialTab);
  const [currentNotificationSubTab, setCurrentNotificationSubTab] = useState<NotificationSubTabKey>("unread");
  const [allData, setAllData] = useState<UnifiedNotification[]>([]);

  const { requests: companyRequests } = useCompanyRequests();
  const { requests: otherRequests } = useOtherRequests();
  const { counts: advCounts } = useAdvertisements();

  useEffect(() => {
    fetchNotifications()
      .then(setAllData)
      .catch(() => setAllData([]));
  }, []);

  const notificationsByCategory = useMemo(
    () => ({
      account_management: getNotificationsByCategory(allData, "account_management").map(unifiedToNotification),
      production: getNotificationsByCategory(allData, "production").map(unifiedToNotification),
      administration: getNotificationsByCategory(allData, "administration").map(unifiedToNotification),
    }),
    [allData]
  );

  const unreadByCategory = useMemo(
    () => ({
      account_management: notificationsByCategory.account_management.filter((n) => n.notification_state === "unread")
        .length,
      production: notificationsByCategory.production.filter((n) => n.notification_state === "unread").length,
      administration: notificationsByCategory.administration.filter((n) => n.notification_state === "unread").length,
    }),
    [notificationsByCategory]
  );

  const pendingByTab = useMemo(
    () => ({
      company: companyRequests.filter((r) => r.request_state === "Pending").length,
      quotations: advCounts.pending,
      other: otherRequests.filter((r) => r.request_state === "Pending").length,
    }),
    [companyRequests, otherRequests, advCounts.pending]
  );

  useEffect(() => {
    const tab = searchParams.get("tab") as MainTabKey | null;
    if (tab && validTabs.includes(tab)) {
      setCurrentMainTab(tab);
    }
  }, [searchParams]);

  const currentNotifications: MappedNotificationRow[] = useMemo(() => {
    if (currentMainTab === "account_management") return notificationsByCategory.account_management;
    if (currentMainTab === "production") return notificationsByCategory.production;
    if (currentMainTab === "administration") return notificationsByCategory.administration;
    return [];
  }, [currentMainTab, notificationsByCategory]);

  const filteredNotifications = useMemo(() => {
    return currentNotifications
      .filter((n) => n.notification_state === currentNotificationSubTab)
      .sort((a, b) => new Date(b.notification_time).getTime() - new Date(a.notification_time).getTime());
  }, [currentNotifications, currentNotificationSubTab]);

  const mainTabs: { key: MainTabKey; label: string }[] = [
    { key: "company", label: "Company Creation Requests" },
    { key: "quotations", label: "Advertisement quotations" },
    { key: "product", label: "Product Tickets" },
    { key: "account_management", label: "Account Management Tickets" },
    { key: "production", label: "Production Tickets" },
    { key: "administration", label: "Administration Tickets" },
    { key: "other", label: "Other Communications" },
  ];

  const breadcrumbs = [{ label: "Tickets" }];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: "Tickets", breadcrumbs, buttons: [] });
  }, [setPageMeta]);

  const handleMainTabClick = (key: MainTabKey) => {
    setCurrentMainTab(key);
    router.push(`/logged/pages/tickets?tab=${key}`, { scroll: false });
  };

  const notificationTabProps = {
    notifications: filteredNotifications,
    currentSubTab: currentNotificationSubTab,
    onSubTabChange: setCurrentNotificationSubTab,
    formatNotificationTime,
  };

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full mt-6 md:mt-8">
          <div className="flex border-b border-gray-200 flex-wrap">
            {mainTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleMainTabClick(tab.key)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  currentMainTab === tab.key
                    ? "text-blue-950 border-b-2 border-blue-950 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {tab.key === "company" && pendingByTab.company > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab.company}
                  </span>
                )}
                {tab.key === "quotations" && pendingByTab.quotations > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab.quotations}
                  </span>
                )}
                {tab.key === "account_management" && unreadByCategory.account_management > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {unreadByCategory.account_management}
                  </span>
                )}
                {tab.key === "production" && unreadByCategory.production > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {unreadByCategory.production}
                  </span>
                )}
                {tab.key === "administration" && unreadByCategory.administration > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {unreadByCategory.administration}
                  </span>
                )}
                {tab.key === "other" && pendingByTab.other > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab.other}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-hidden">
            {currentMainTab === "company" && <CompanyTab />}
            {currentMainTab === "quotations" && <QuotationsTab />}
            {currentMainTab === "product" && <ProductTab />}
            {currentMainTab === "other" && <OtherTab />}
            {currentMainTab === "account_management" && <AccountManagementTicketsTab {...notificationTabProps} />}
            {currentMainTab === "production" && <ProductionTicketsTab {...notificationTabProps} />}
            {currentMainTab === "administration" && <AdministrationTicketsTab {...notificationTabProps} />}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default TicketsPage;
