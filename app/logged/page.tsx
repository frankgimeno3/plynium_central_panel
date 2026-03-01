"use client"

import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import notificationsData from '@/app/contents/notifications.json';
import otherRequestsData from '@/app/contents/otherRequests.json';
import companyRequestData from '@/app/contents/companyRequest.json';
import advertisementRequestData from '@/app/contents/advertisementRequest.json';
import ga4Data from '@/app/contents/ga4.json';

type NotificationState = 'unread' | 'read' | 'solved';

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

interface LoggedProps {
}

const Logged: FC<LoggedProps> = ({ }) => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'other'>('notifications');
  const [ga4PortalTab, setGa4PortalTab] = useState(0);
  const [userName, setUserName] = useState<string>('User');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => setUserName(data.user_name || 'User'))
      .catch(() => setUserName('User'));
  }, []);

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

  const mainNotifications = notifications.slice(0, 5);

  const pendingOtherFull = (otherRequestsData as { id: string; author: string; content: string; request_state: string }[])
    .filter(r => r.request_state === 'Pending');
  const pendingCompanyFull = (companyRequestData as { companyRequestId: string; content: { nombre_comercial: string }; request_state: string }[])
    .filter(r => r.request_state === 'Pending');
  const pendingAdvertisementFull = (advertisementRequestData as { idAdvReq: string; senderCompany: string; requestDescription: string; advReqState: string }[])
    .filter(r => r.advReqState === 'pending');
  const allPendingItems = [
    ...pendingOtherFull.map(r => ({ type: 'other' as const, ...r })),
    ...pendingCompanyFull.map(r => ({ type: 'company' as const, ...r })),
    ...pendingAdvertisementFull.map(r => ({ type: 'advertisement' as const, ...r })),
  ];
  const pendingItemsFirst5 = allPendingItems.slice(0, 5);

  const portals = (ga4Data as { portals: { id: string; name: string }[] }).portals ?? [];
  const currentPortal = portals[ga4PortalTab];
  const tableRows = currentPortal
    ? ((ga4Data as { tableRowsByPortal: Record<string, { page: string; users: number; sessions: number; pageViews: number; avgTime: number; bounceRate: number }[]> }).tableRowsByPortal?.[currentPortal.id] ?? [])
    : [];

  return (
    <div className='flex flex-col w-full bg-white p-12'>
      <p className='font-bold text-2xl'>Welcome, {userName}</p>
      <p className='mt-12 font-bold mb-3'>Main notifications</p>

      {/* Tabs */}
      <div className='flex border-b border-gray-200 bg-white'>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`
            px-6 py-3 text-sm font-medium transition-colors
            ${activeTab === 'notifications'
              ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          Notifications
        </button>
        <button
          onClick={() => setActiveTab('other')}
          className={`
            px-6 py-3 text-sm font-medium transition-colors
            ${activeTab === 'other'
              ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          Other
        </button>
      </div>

      {/* Tab Content */}
      <div className=' flex flex-col bg-gray-100 pb-1 shadow-xl border-t border-gray-100'>
        {activeTab === 'notifications' ? (
          <>
            {mainNotifications.map((n) => (
              <Link
                key={n.notification_id}
                href={`/logged/pages/notifications/${n.notification_id}`}
                className='flex flex-row justify-between bg-white p-4 border-b border-gray-100 cursor-pointer hover:bg-white/70'
              >
                <p>{n.notification_brief_description}</p>
                <p>{formatNotificationTime(n.notification_time)}</p>
              </Link>
            ))}
            <div className='flex flex-row justify-end'>
              <Link
                href='/logged/pages/notifications'
                className='bg-white text-gray-600 hover:bg-white/50 px-4 py-2 m-3 cursor-pointer inline-block'
              >
                See all notifications
              </Link>
            </div>
          </>
        ) : (
          <>
            {pendingItemsFirst5.map((item) =>
              item.type === 'other' ? (
                <Link
                  key={item.id}
                  href={`/logged/pages/requests/requests/${encodeURIComponent(item.id)}`}
                  className='flex flex-row justify-between bg-white p-4 border-b border-gray-100 cursor-pointer hover:bg-white/70'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{item.author}</p>
                    <p className='text-sm text-gray-600 mt-0.5 line-clamp-1'>{item.content}</p>
                  </div>
                  <span className='shrink-0 ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded'>Other - Pending</span>
                </Link>
              ) : item.type === 'company' ? (
                <Link
                  key={item.companyRequestId}
                  href={`/logged/pages/requests/company/${encodeURIComponent(item.companyRequestId)}`}
                  className='flex flex-row justify-between bg-white p-4 border-b border-gray-100 cursor-pointer hover:bg-white/70'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{item.content.nombre_comercial}</p>
                    <p className='text-sm text-gray-600 mt-0.5'>Company registration request</p>
                  </div>
                  <span className='shrink-0 ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded'>Company - Pending</span>
                </Link>
              ) : (
                <Link
                  key={item.idAdvReq}
                  href={`/logged/pages/requests/quotations/${encodeURIComponent(item.idAdvReq)}`}
                  className='flex flex-row justify-between bg-white p-4 border-b border-gray-100 cursor-pointer hover:bg-white/70'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{item.senderCompany}</p>
                    <p className='text-sm text-gray-600 mt-0.5 line-clamp-1'>{item.requestDescription}</p>
                  </div>
                  <span className='shrink-0 ml-2 px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded'>Advertisement - Pending</span>
                </Link>
              )
            )}
            {allPendingItems.length === 0 && (
              <p className='p-6 text-gray-500 text-center'>No pending requests</p>
            )}
            <div className='flex flex-row justify-end'>
              <Link
                href='/logged/pages/notifications?tab=other'
                className='bg-white text-gray-600 hover:bg-white/50 px-4 py-2 m-3 cursor-pointer inline-block'
              >
                See all other
              </Link>
            </div>
          </>
        )}
      </div>

      <p className='mt-12 font-bold mb-3'>Google Analytics</p>
      <div className='flex border-b border-gray-200 bg-white'>
        {portals.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setGa4PortalTab(i)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              ga4PortalTab === i
                ? 'text-blue-950 border-b-2 border-blue-950 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className='flex flex-col bg-gray-100 shadow-xl border-t border-gray-100'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-gray-50 border-b border-gray-200'>
                <th className='text-left px-4 py-3 font-semibold text-gray-700'>Page</th>
                <th className='text-right px-4 py-3 font-semibold text-gray-700'>Users</th>
                <th className='text-right px-4 py-3 font-semibold text-gray-700'>Sessions</th>
                <th className='text-right px-4 py-3 font-semibold text-gray-700'>Page views</th>
                <th className='text-right px-4 py-3 font-semibold text-gray-700'>Avg. time (s)</th>
                <th className='text-right px-4 py-3 font-semibold text-gray-700'>Bounce rate %</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className='bg-white border-b border-gray-100 hover:bg-gray-50'>
                  <td className='px-4 py-3 text-gray-900'>{row.page}</td>
                  <td className='px-4 py-3 text-right text-gray-700'>{row.users.toLocaleString()}</td>
                  <td className='px-4 py-3 text-right text-gray-700'>{row.sessions.toLocaleString()}</td>
                  <td className='px-4 py-3 text-right text-gray-700'>{row.pageViews.toLocaleString()}</td>
                  <td className='px-4 py-3 text-right text-gray-700'>{row.avgTime}</td>
                  <td className='px-4 py-3 text-right text-gray-700'>{row.bounceRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='flex justify-end p-3'>
          <Link
            href='/logged/pages/ga4'
            className='bg-blue-950 text-white hover:bg-blue-900 px-4 py-2 rounded-lg text-sm font-medium'
          >
            View full analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Logged;
