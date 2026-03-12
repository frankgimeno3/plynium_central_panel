"use client";

import { FC, useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import notificationsData from '@/app/contents/notifications.json';
import otherRequestsData from '@/app/contents/otherRequests.json';
import companyRequestData from '@/app/contents/companyRequest.json';
import advertisementRequestData from '@/app/contents/advertisementRequest.json';

type NotificationState = 'unread' | 'read' | 'solved';
type TabKey = NotificationState | 'other';

interface Notification {
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

const NotificationsPage: FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = (searchParams.get('tab') as TabKey) || 'unread';
  const [currentTab, setCurrentTab] = useState<TabKey>(initialTab);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabKey | null;
    if (tabParam && ['unread', 'read', 'solved', 'other'].includes(tabParam)) {
      setCurrentTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const loaded = Array.isArray(notificationsData)
      ? (notificationsData as Notification[]).map((n: Notification) => ({
          notification_id: n.notification_id,
          notification_brief_description: n.notification_brief_description,
          notification_time: n.notification_time,
          notification_state: n.notification_state as NotificationState,
          notification_description: n.notification_description
        }))
      : [];
    setNotifications(loaded);
  }, []);

  const filteredNotifications = useMemo(() => {
    if (currentTab === 'other') return [];
    return notifications
      .filter(n => n.notification_state === currentTab)
      .sort((a, b) => new Date(b.notification_time).getTime() - new Date(a.notification_time).getTime());
  }, [notifications, currentTab]);

  const pendingOtherRequests = useMemo(() =>
    (otherRequestsData as { id: string; author: string; content: string; request_state: string }[])
      .filter(r => r.request_state === 'Pending'), []);
  const pendingCompanyRequests = useMemo(() =>
    (companyRequestData as { companyRequestId: string; content: { nombre_comercial: string }; request_state: string }[])
      .filter(r => r.request_state === 'Pending'), []);
  const pendingAdvertisementRequests = useMemo(() =>
    (advertisementRequestData as { idAdvReq: string; senderCompany: string; requestDescription: string; advReqState: string }[])
      .filter(r => r.advReqState === 'pending'), []);

  type OtherRow = { type: 'other'; id: string; description: string; state: string; href: string } | { type: 'company'; id: string; description: string; state: string; href: string } | { type: 'advertisement'; id: string; description: string; state: string; href: string };
  const otherTableRows = useMemo((): OtherRow[] => {
    const other: OtherRow[] = pendingOtherRequests.map((r) => ({
      type: 'other',
      id: r.id,
      description: r.content,
      state: r.request_state,
      href: `/logged/pages/network/requests/other/${encodeURIComponent(r.id)}`,
    }));
    const company: OtherRow[] = pendingCompanyRequests.map((r) => ({
      type: 'company',
      id: r.companyRequestId,
      description: r.content.nombre_comercial + ' – Company registration request',
      state: r.request_state,
      href: `/logged/pages/network/requests/company/${encodeURIComponent(r.companyRequestId)}`,
    }));
    const adv: OtherRow[] = pendingAdvertisementRequests.map((r) => ({
      type: 'advertisement',
      id: r.idAdvReq,
      description: r.requestDescription,
      state: r.advReqState,
      href: `/logged/pages/network/requests/quotations/${encodeURIComponent(r.idAdvReq)}`,
    }));
    return [...other, ...company, ...adv];
  }, [pendingOtherRequests, pendingCompanyRequests, pendingAdvertisementRequests]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'solved', label: 'Solved' },
    { key: 'other', label: 'Other' }
  ];

  const breadcrumbs = [{ label: 'Notifications' }];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    setPageMeta({ pageTitle: 'Notifications', breadcrumbs, buttons: [] });
  }, [setPageMeta]);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCurrentTab(tab.key)}
                className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                  currentTab === tab.key
                    ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
          {currentTab === 'other' ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Type</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>ID</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>Description</th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>State</th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {otherTableRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className='px-6 py-8 text-center text-gray-500'>
                        No pending requests
                      </td>
                    </tr>
                  ) : (
                    otherTableRows.map((row) => (
                      <tr
                        key={`${row.type}-${row.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(row.href)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(row.href)}
                        className='hover:bg-gray-100 cursor-pointer'
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {row.type === 'other' ? 'Other' : row.type === 'company' ? 'Company' : 'Advertisement'}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900'>{row.id}</td>
                        <td className='px-6 py-4 text-sm text-gray-900 line-clamp-2 max-w-md'>{row.description}</td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <span className='inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800'>
                            {row.state}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='overflow-x-auto'>
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
                        No notifications in this category.
                      </td>
                    </tr>
                  ) : (
                    filteredNotifications.map((n) => (
                      <tr
                        key={n.notification_id}
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/logged/pages/notifications/${n.notification_id}`)}
                        onKeyDown={(e) => e.key === 'Enter' && router.push(`/logged/pages/notifications/${n.notification_id}`)}
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
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            n.notification_state === 'unread' ? 'bg-amber-100 text-amber-800' :
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
        </div>
      </PageContentSection>
    </>
  );
};

function NotificationsPageWithSuspense() {
  return (
    <Suspense fallback={<div className='p-12 text-gray-600'>Loading...</div>}>
      <NotificationsPage />
    </Suspense>
  );
}

export default NotificationsPageWithSuspense;
