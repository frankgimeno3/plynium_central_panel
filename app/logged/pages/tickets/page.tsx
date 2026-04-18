"use client";

import { FC, useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import { fetchNotifications, getNotificationsByCategory, unifiedToNotification, type UnifiedNotification, type NotificationCategory } from '@/app/contents/notifications.types';
import { useCompanyRequests } from '@/app/logged/pages/network/requests/hooks/useCompanyRequests';
import { useOtherRequests } from '@/app/logged/pages/network/requests/hooks/useOtherRequests';
import { useAdvertisements } from '@/app/logged/pages/network/requests/hooks/useAdvertisements';
import CompanyCreationRequestsTab from './components/CompanyCreationRequestsTab';
import AdvertisementQuotationsTab from './components/AdvertisementQuotationsTab';
import OtherCommunicationsTab from './components/OtherCommunicationsTab';

type NotificationState = 'unread' | 'read' | 'solved';
type MainTabKey = 'company' | 'quotations' | 'account_management' | 'production' | 'administration' | 'other';
type NotificationSubTabKey = NotificationState;

interface MappedNotification {
  notification_id: string;
  notification_brief_description: string;
  notification_time: string;
  notification_state: NotificationState;
  notification_description: string;
}

const formatNotificationTime = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const TicketsPage: FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as MainTabKey | null;
  const validTabs: MainTabKey[] = ['company', 'quotations', 'account_management', 'production', 'administration', 'other'];
  const initialTab: MainTabKey = tabParam && validTabs.includes(tabParam) ? tabParam : 'company';
  
  const [currentMainTab, setCurrentMainTab] = useState<MainTabKey>(initialTab);
  const [currentNotificationSubTab, setCurrentNotificationSubTab] = useState<NotificationSubTabKey>('unread');
  const [allData, setAllData] = useState<UnifiedNotification[]>([]);

  const { requests: companyRequests } = useCompanyRequests();
  const { requests: otherRequests } = useOtherRequests();
  const { counts: advCounts } = useAdvertisements();

  useEffect(() => {
    // `notification_type` query → `panel_ticket_type` in RDS (inbox-style tickets).
    fetchNotifications({ notification_type: 'notification' })
      .then(setAllData)
      .catch(() => setAllData([]));
  }, []);

  const notificationsByCategory = useMemo(() => ({
    account_management: getNotificationsByCategory(allData, 'account_management').map(unifiedToNotification),
    production: getNotificationsByCategory(allData, 'production').map(unifiedToNotification),
    administration: getNotificationsByCategory(allData, 'administration').map(unifiedToNotification),
  }), [allData]);

  const unreadByCategory = useMemo(() => ({
    account_management: notificationsByCategory.account_management.filter(n => n.notification_state === 'unread').length,
    production: notificationsByCategory.production.filter(n => n.notification_state === 'unread').length,
    administration: notificationsByCategory.administration.filter(n => n.notification_state === 'unread').length,
  }), [notificationsByCategory]);

  const pendingByTab = useMemo(
    () => ({
      company: companyRequests.filter((r) => r.request_state === "Pending").length,
      quotations: advCounts.pending,
      other: otherRequests.filter((r) => r.request_state === "Pending").length,
    }),
    [companyRequests, otherRequests, advCounts.pending]
  );

  useEffect(() => {
    const tab = searchParams.get('tab') as MainTabKey | null;
    if (tab && validTabs.includes(tab)) {
      setCurrentMainTab(tab);
    }
  }, [searchParams]);

  const currentNotifications: MappedNotification[] = useMemo(() => {
    if (currentMainTab === 'account_management') return notificationsByCategory.account_management;
    if (currentMainTab === 'production') return notificationsByCategory.production;
    if (currentMainTab === 'administration') return notificationsByCategory.administration;
    return [];
  }, [currentMainTab, notificationsByCategory]);

  const filteredNotifications = useMemo(() => {
    return currentNotifications
      .filter(n => n.notification_state === currentNotificationSubTab)
      .sort((a, b) => new Date(b.notification_time).getTime() - new Date(a.notification_time).getTime());
  }, [currentNotifications, currentNotificationSubTab]);

  const mainTabs: { key: MainTabKey; label: string }[] = [
    { key: 'company', label: 'Company Creation Requests' },
    { key: 'quotations', label: 'Advertisement quotations' },
    { key: 'account_management', label: 'Account Management Tickets' },
    { key: 'production', label: 'Production Tickets' },
    { key: 'administration', label: 'Administration Tickets' },
    { key: 'other', label: 'Other Communications' },
  ];

  const notificationSubTabs: { key: NotificationSubTabKey; label: string }[] = [
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'solved', label: 'Solved' },
  ];

  const breadcrumbs = [{ label: 'Tickets' }];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: 'Tickets', breadcrumbs, buttons: [] });
  }, [setPageMeta]);

  const handleMainTabClick = (key: MainTabKey) => {
    setCurrentMainTab(key);
    router.push(`/logged/pages/tickets?tab=${key}`, { scroll: false });
  };

  const isNotificationTab = ['account_management', 'production', 'administration'].includes(currentMainTab);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full mt-12">
          <div className="flex border-b border-gray-200 flex-wrap">
            {mainTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleMainTabClick(tab.key)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${currentMainTab === tab.key
                  ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
                {tab.key === 'company' && pendingByTab.company > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab.company}
                  </span>
                )}
                {tab.key === 'quotations' && pendingByTab.quotations > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab.quotations}
                  </span>
                )}
                {tab.key === 'account_management' && unreadByCategory.account_management > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {unreadByCategory.account_management}
                  </span>
                )}
                {tab.key === 'production' && unreadByCategory.production > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {unreadByCategory.production}
                  </span>
                )}
                {tab.key === 'administration' && unreadByCategory.administration > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {unreadByCategory.administration}
                  </span>
                )}
                {tab.key === 'other' && pendingByTab.other > 0 && (
                  <span className="inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600">
                    {pendingByTab.other}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-hidden">
            {currentMainTab === 'company' && <CompanyCreationRequestsTab />}
            {currentMainTab === 'quotations' && <AdvertisementQuotationsTab />}
            {currentMainTab === 'other' && <OtherCommunicationsTab />}
            {isNotificationTab && (
              <div className="p-6">
                <div className="flex border-b border-gray-200 mb-4">
                  {notificationSubTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setCurrentNotificationSubTab(tab.key)}
                      className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${currentNotificationSubTab === tab.key
                        ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>ID</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Description</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Time</th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>State</th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {filteredNotifications.length === 0 ? (
                      <tr>
                        <td colSpan={4} className='px-6 py-8 text-center text-gray-500'>
                          No tickets in this category.
                        </td>
                      </tr>
                    ) : (
                      filteredNotifications.map((n) => (
                        <tr
                          key={n.notification_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/logged/pages/tickets/${n.notification_id}`)}
                          onKeyDown={(e) => e.key === 'Enter' && router.push(`/logged/pages/tickets/${n.notification_id}`)}
                          className='hover:bg-gray-100 cursor-pointer'
                        >
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900'>
                            {n.notification_id}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-900'>
                            {n.notification_brief_description}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                            {formatNotificationTime(n.notification_time)}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap'>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${n.notification_state === 'unread' ? 'bg-amber-100 text-amber-800' :
                              n.notification_state === 'read' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {n.notification_state}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

function TicketsPageWithSuspense() {
  return (
    <Suspense fallback={<div className='p-12 text-gray-600'>Loading...</div>}>
      <TicketsPage />
    </Suspense>
  );
}

export default TicketsPageWithSuspense;
