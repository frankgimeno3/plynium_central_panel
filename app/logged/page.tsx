"use client"

import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import notificationsData from '@/app/contents/notifications.json';
import otherRequestsData from '@/app/contents/otherRequests.json';
import companyRequestData from '@/app/contents/companyRequest.json';
import advertisementRequestData from '@/app/contents/advertisementRequest.json';
import ga4Data from '@/app/contents/ga4.json';
import ManagementDashboard from './logged_components/ManagementDashboard';

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

function useTypewriter(fullText: string, enabled: boolean = true, speedMs: number = 60) {
  const [displayText, setDisplayText] = useState('');
  useEffect(() => {
    if (!enabled || !fullText) {
      setDisplayText(fullText);
      return;
    }
    setDisplayText('');
    let i = 0;
    const t = setInterval(() => {
      if (i <= fullText.length) {
        setDisplayText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(t);
      }
    }, speedMs);
    return () => clearInterval(t);
  }, [fullText, enabled, speedMs]);
  return displayText;
}

interface LoggedProps {
}

const Logged: FC<LoggedProps> = ({ }) => {
  const { setPageMeta } = usePageContent();
  const [activeTab, setActiveTab] = useState<'notifications' | 'other'>('notifications');
  const [ga4PortalTab, setGa4PortalTab] = useState(0);
  const [userName, setUserName] = useState<string>('User');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setPageMeta({ pageTitle: 'Dashboard', breadcrumbs: [] });
  }, [setPageMeta]);

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
  const welcomeFull = `Welcome, ${userName}`;
  const welcomeDisplay = useTypewriter(welcomeFull, true, 55);
  const welcomeComplete = welcomeDisplay.length >= welcomeFull.length;

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
    <div className='flex flex-col w-full text-slate-200 p-12 pt-24 '>
      <p className='font-bold text-2xl min-h-[2.5rem] text-center text-slate-100'>
        {welcomeDisplay}
        {!welcomeComplete && <span className='animate-pulse'>|</span>}
      </p>

      <p className='mt-10 font-bold mb-3 text-slate-100'>Management Dashboard</p>
      <ManagementDashboard />

      <p className='mt-12 font-bold mb-3 text-slate-100'>Main notifications</p>

      {/* Tabs */}
      <div className='flex border-b border-slate-600 bg-slate-800/50 rounded-t-lg overflow-hidden'>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`
            px-6 py-3 text-sm font-medium transition-colors
            ${activeTab === 'notifications'
              ? 'text-blue-200 border-b-2 border-blue-400 bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/70'
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
              ? 'text-blue-200 border-b-2 border-blue-400 bg-slate-700 text-white'
              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/70'
            }
          `}
        >
          Other
        </button>
      </div>

      {/* Tab Content */}
      <div className='flex flex-col bg-slate-800/50 pb-1 shadow-xl border border-slate-600 border-t-0 rounded-b-lg'>
        {activeTab === 'notifications' ? (
          <>
            {mainNotifications.map((n) => (
              <Link
                key={n.notification_id}
                href={`/logged/pages/notifications/${n.notification_id}`}
                className='flex flex-row justify-between bg-slate-800 p-4 border-b border-slate-600 cursor-pointer hover:bg-slate-700 text-slate-200'
              >
                <p>{n.notification_brief_description}</p>
                <p className='text-slate-400 text-sm'>{formatNotificationTime(n.notification_time)}</p>
              </Link>
            ))}
            <div className='flex flex-row justify-end'>
              <Link
                href='/logged/pages/notifications'
                className='bg-slate-700 text-slate-200 hover:bg-slate-600 px-4 py-2 m-3 cursor-pointer inline-block rounded-lg text-sm font-medium'
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
                  href={`/logged/pages/account-management/requests/requests/${encodeURIComponent(item.id)}`}
                  className='flex flex-row justify-between bg-slate-800 p-4 border-b border-slate-600 cursor-pointer hover:bg-slate-700'
                >
                  <div>
                    <p className='font-medium text-slate-100'>{item.author}</p>
                    <p className='text-sm text-slate-400 mt-0.5 line-clamp-1'>{item.content}</p>
                  </div>
                  <span className='shrink-0 ml-2 px-2 py-1 text-xs bg-amber-900/60 text-amber-200 rounded'>Other - Pending</span>
                </Link>
              ) : item.type === 'company' ? (
                <Link
                  key={item.companyRequestId}
                  href={`/logged/pages/account-management/requests/company/${encodeURIComponent(item.companyRequestId)}`}
                  className='flex flex-row justify-between bg-slate-800 p-4 border-b border-slate-600 cursor-pointer hover:bg-slate-700'
                >
                  <div>
                    <p className='font-medium text-slate-100'>{item.content.nombre_comercial}</p>
                    <p className='text-sm text-slate-400 mt-0.5'>Company registration request</p>
                  </div>
                  <span className='shrink-0 ml-2 px-2 py-1 text-xs bg-amber-900/60 text-amber-200 rounded'>Company - Pending</span>
                </Link>
              ) : (
                <Link
                  key={item.idAdvReq}
                  href={`/logged/pages/account-management/requests/quotations/${encodeURIComponent(item.idAdvReq)}`}
                  className='flex flex-row justify-between bg-slate-800 p-4 border-b border-slate-600 cursor-pointer hover:bg-slate-700'
                >
                  <div>
                    <p className='font-medium text-slate-100'>{item.senderCompany}</p>
                    <p className='text-sm text-slate-400 mt-0.5 line-clamp-1'>{item.requestDescription}</p>
                  </div>
                  <span className='shrink-0 ml-2 px-2 py-1 text-xs bg-amber-900/60 text-amber-200 rounded'>Advertisement - Pending</span>
                </Link>
              )
            )}
            {allPendingItems.length === 0 && (
              <p className='p-6 text-slate-400 text-center'>No pending requests</p>
            )}
            <div className='flex flex-row justify-end'>
              <Link
                href='/logged/pages/notifications?tab=other'
                className='bg-slate-700 text-slate-200 hover:bg-slate-600 px-4 py-2 m-3 cursor-pointer inline-block rounded-lg text-sm font-medium'
              >
                See all other
              </Link>
            </div>
          </>
        )}
      </div>

      <p className='mt-12 font-bold mb-3 text-slate-100'>Google Analytics</p>
      <div className='flex border-b border-slate-600 bg-slate-800/50 rounded-t-lg overflow-hidden'>
        {portals.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setGa4PortalTab(i)}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              ga4PortalTab === i
                ? 'text-blue-200 border-b-2 border-blue-400 bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-700/70'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className='flex flex-col bg-slate-800/50 shadow-xl border border-slate-600 border-t-0 rounded-b-lg'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='bg-slate-700 border-b border-slate-600'>
                <th className='text-left px-4 py-3 font-semibold text-slate-300'>Page</th>
                <th className='text-right px-4 py-3 font-semibold text-slate-300'>Users</th>
                <th className='text-right px-4 py-3 font-semibold text-slate-300'>Sessions</th>
                <th className='text-right px-4 py-3 font-semibold text-slate-300'>Page views</th>
                <th className='text-right px-4 py-3 font-semibold text-slate-300'>Avg. time (s)</th>
                <th className='text-right px-4 py-3 font-semibold text-slate-300'>Bounce rate %</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, i) => (
                <tr key={i} className='bg-slate-800 border-b border-slate-600 hover:bg-slate-700'>
                  <td className='px-4 py-3 text-slate-100'>{row.page}</td>
                  <td className='px-4 py-3 text-right text-slate-200'>{row.users.toLocaleString()}</td>
                  <td className='px-4 py-3 text-right text-slate-200'>{row.sessions.toLocaleString()}</td>
                  <td className='px-4 py-3 text-right text-slate-200'>{row.pageViews.toLocaleString()}</td>
                  <td className='px-4 py-3 text-right text-slate-200'>{row.avgTime}</td>
                  <td className='px-4 py-3 text-right text-slate-200'>{row.bounceRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className='flex justify-end p-3'>
          <Link
            href='/logged/pages/ga4'
            className='bg-blue-600 text-white hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium'
          >
            View full analytics
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Logged;
