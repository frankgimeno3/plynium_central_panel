"use client";

import { FC, useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
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

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'unread', label: 'Unread' },
    { key: 'read', label: 'Read' },
    { key: 'solved', label: 'Solved' },
    { key: 'other', label: 'Other' }
  ];

  return (
    <div className='flex flex-col w-full bg-white'>
      <div className='text-center bg-blue-950/70 p-5 text-white'>
        <p className='text-2xl'>Notifications</p>
        <p className='text-sm text-blue-100 mt-1'>Manage all your notifications</p>
      </div>
      <div className='px-6 py-6'>
        <div className='flex border-b border-gray-200 bg-white'>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCurrentTab(tab.key)}
              className={`relative px-6 py-3 text-sm font-medium transition-colors ${
                currentTab === tab.key
                  ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className='bg-white shadow-sm rounded-b-lg overflow-hidden'>
          {currentTab === 'other' ? (
            <div className='p-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {pendingOtherRequests.map((r) => (
                  <Link
                    key={r.id}
                    href={`/logged/pages/requests/requests/${encodeURIComponent(r.id)}`}
                    className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer'
                  >
                    <p className='font-medium text-gray-900'>{r.author}</p>
                    <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{r.content}</p>
                    <span className='inline-block mt-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded'>Other Request - Pending</span>
                  </Link>
                ))}
                {pendingCompanyRequests.map((r) => (
                  <Link
                    key={r.companyRequestId}
                    href={`/logged/pages/requests/company/${encodeURIComponent(r.companyRequestId)}`}
                    className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer'
                  >
                    <p className='font-medium text-gray-900'>{r.content.nombre_comercial}</p>
                    <p className='text-sm text-gray-600 mt-1'>Company registration request</p>
                    <span className='inline-block mt-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded'>Company - Pending</span>
                  </Link>
                ))}
                {pendingAdvertisementRequests.map((r) => (
                  <Link
                    key={r.idAdvReq}
                    href={`/logged/pages/requests/quotations/${encodeURIComponent(r.idAdvReq)}`}
                    className='bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 cursor-pointer'
                  >
                    <p className='font-medium text-gray-900'>{r.senderCompany}</p>
                    <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{r.requestDescription}</p>
                    <span className='inline-block mt-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded'>Advertisement - Pending</span>
                  </Link>
                ))}
              </div>
              {pendingOtherRequests.length === 0 && pendingCompanyRequests.length === 0 && pendingAdvertisementRequests.length === 0 && (
                <p className='text-gray-500 text-center py-8'>No pending requests</p>
              )}
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
                        className='hover:bg-gray-100'
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900'>
                          <Link href={`/logged/pages/notifications/${n.notification_id}`} className='text-blue-950 hover:underline'>
                            {n.notification_id}
                          </Link>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-900'>
                          <Link href={`/logged/pages/notifications/${n.notification_id}`} className='text-blue-950 hover:underline'>
                            {n.notification_brief_description}
                          </Link>
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
