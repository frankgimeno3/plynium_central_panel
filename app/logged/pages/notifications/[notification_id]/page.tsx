"use client";

import { FC, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import notificationsData from '@/app/contents/notifications.json';
import otherRequestsData from '@/app/contents/otherRequests.json';
import customersData from '@/app/contents/customers.json';

type NotificationState = 'unread' | 'read' | 'solved';

interface Notification {
  notification_id: string;
  notification_brief_description: string;
  notification_time: string;
  notification_state: NotificationState;
  notification_description: string;
}

/** Parses notification description and returns redirection link when applicable. */
function getRedirectionLink(description: string): { href: string; label: string } | null {
  const d = description || '';
  // Request ID: oreq-XXX
  const oreqMatch = d.match(/Request ID:\s*(\S+)/i) || d.match(/\b(oreq-\d+)\b/i);
  const creqMatch = d.match(/\b(creq-\d+)\b/i);
  const advMatch = d.match(/\b(adv-\d+-\d+)\b/i) || d.match(/\b(adv-\d+-\d{4})\b/i);

  // Company profile / Directory update with oreq → try customer by author, else other request
  const isCompanyProfile = /\bcompany profile\b/i.test(d) && (/\bDirectory\b/i.test(d) || /\bdirectory update\b/i.test(d));
  if (isCompanyProfile && oreqMatch) {
    const oreqId = (oreqMatch[1] || '').trim();
    const otherRequests = otherRequestsData as { id: string; author: string }[];
    const req = otherRequests.find((r) => r.id === oreqId);
    if (req) {
      const authorName = req.author.split(/\s*[-–]\s*/)[0]?.trim() || '';
      const customers = customersData as { id_customer: string; name: string; contact?: { name: string } }[];
      const customer = customers.find(
        (c) =>
          c.name.toLowerCase().includes(authorName.toLowerCase()) ||
          c.contact?.name?.toLowerCase().includes(authorName.toLowerCase())
      );
      if (customer) {
        return {
          href: `/logged/pages/account-management/customers_db/${encodeURIComponent(customer.id_customer)}`,
          label: `Go to customer account: ${customer.name}`,
        };
      }
    }
    if (oreqId) {
      return {
        href: `/logged/pages/network/requests/other/${encodeURIComponent(oreqId)}`,
        label: `Ver solicitud Other: ${oreqId}`,
      };
    }
  }

  if (creqMatch) {
    const id = creqMatch[1].trim();
    return {
      href: `/logged/pages/network/requests/company/${encodeURIComponent(id)}`,
      label: `Ver solicitud de empresa: ${id}`,
    };
  }
  if (advMatch) {
    const id = advMatch[1].trim();
    return {
      href: `/logged/pages/network/requests/quotations/${encodeURIComponent(id)}`,
      label: `Ver solicitud de publicidad: ${id}`,
    };
  }
  if (oreqMatch) {
    const id = (oreqMatch[1] || '').trim();
    if (id) {
      return {
        href: `/logged/pages/network/requests/other/${encodeURIComponent(id)}`,
        label: `Ver solicitud Other: ${id}`,
      };
    }
  }
  return null;
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

const NotificationDetailPage: FC = () => {
  const params = useParams();
  const idParam = params?.notification_id;
  const notificationId = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [localState, setLocalState] = useState<NotificationState>('unread');

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

  useEffect(() => {
    if (notifications.length === 0) return;
    const decodedId = decodeURIComponent(notificationId).trim();
    const found = notifications.find(n => n.notification_id === decodedId);
    if (found) {
      setNotification(found);
      setLocalState(found.notification_state);
    } else {
      setNotification(null);
    }
  }, [notificationId, notifications]);

  const handleStateChange = (newState: NotificationState) => {
    if (!notification) return;
    setLocalState(newState);
    setNotification({ ...notification, notification_state: newState });
    setNotifications(prev =>
      prev.map(n =>
        n.notification_id === notification.notification_id
          ? { ...n, notification_state: newState }
          : n
      )
    );
  };

  const stateOptions: NotificationState[] = ['unread', 'read', 'solved'];

  const breadcrumbsList = [
    { label: 'Notifications', href: '/logged/pages/notifications' },
    { label: notification?.notification_brief_description ?? notificationId ?? 'Detail' },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (!notification && notifications.length > 0) {
      setPageMeta({
        pageTitle: 'Notification not found',
        breadcrumbs: [{ label: 'Notifications', href: '/logged/pages/notifications' }, { label: 'Not found' }],
        buttons: [{ label: 'Back to Notifications', href: '/logged/pages/notifications' }],
      });
    } else if (!notification) {
      setPageMeta({ pageTitle: 'Notification', breadcrumbs: [{ label: 'Notifications', href: '/logged/pages/notifications' }] });
    } else {
      setPageMeta({
        pageTitle: 'Notification Details',
        breadcrumbs: breadcrumbsList,
        buttons: [{ label: 'Back to Notifications', href: '/logged/pages/notifications' }],
      });
    }
  }, [notification, notifications.length, notificationId, setPageMeta]);

  if (!notification && notifications.length > 0) {
    return (
      <PageContentSection>
        <p className='text-red-500 text-lg'>Notification not found.</p>
      </PageContentSection>
    );
  }

  if (!notification) {
    return (
      <PageContentSection>
        <p className='text-gray-600'>Loading...</p>
      </PageContentSection>
    );
  }

  const redirectionLink = getRedirectionLink(notification.notification_description);

  return (
    <>
      <PageContentSection>
        <div className='space-y-4 mb-6'>
            <div>
              <label className='text-sm font-medium text-gray-500'>Notification ID</label>
              <p className='text-lg text-gray-900 font-mono'>{notification.notification_id}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>State</label>
              <select
                value={localState}
                onChange={(e) => handleStateChange(e.target.value as NotificationState)}
                className='mt-1 block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900'
              >
                {stateOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>Time</label>
              <p className='text-lg text-gray-900'>{formatNotificationTime(notification.notification_time)}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>Brief Description</label>
              <p className='text-base text-gray-900'>{notification.notification_brief_description}</p>
            </div>
            <div>
              <label className='text-sm font-medium text-gray-500'>Redirection link</label>
              {redirectionLink ? (
                <p className='text-base text-gray-900 mt-1'>
                  <Link href={redirectionLink.href} className='text-blue-950 hover:underline'>
                    {redirectionLink.label}
                  </Link>
                </p>
              ) : (
                <p className='text-base text-gray-500 mt-1'>There is no link for this notification.</p>
              )}
            </div>
          </div>

          <div className='border-t pt-6'>
            <label className='text-sm font-medium text-gray-500'>Full Description</label>
            <p className='text-base text-gray-900 mt-1 whitespace-pre-wrap'>{notification.notification_description}</p>
          </div>
      </PageContentSection>
    </>
  );
};

export default NotificationDetailPage;
