"use client";

import { FC, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import notificationsData from '@/app/contents/notifications.json';

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

const NotificationDetailPage: FC = () => {
  const params = useParams();
  const router = useRouter();
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

  if (!notification && notifications.length > 0) {
    return (
      <main className='flex flex-col w-full min-h-screen bg-white items-center justify-center p-12'>
        <p className='text-red-500 text-lg'>Notification not found.</p>
        <Link
          href='/logged/pages/notifications'
          className='mt-4 px-4 py-2 bg-blue-950 text-white rounded-xl hover:bg-blue-950/80'
        >
          Back to Notifications
        </Link>
      </main>
    );
  }

  if (!notification) {
    return (
      <main className='flex flex-col w-full min-h-screen bg-white items-center justify-center p-12'>
        <p className='text-gray-600'>Loading...</p>
      </main>
    );
  }

  return (
    <main className='flex flex-col w-full min-h-screen bg-white'>
      <div className='flex flex-col text-center bg-blue-950/70 p-5 text-white'>
        <p className='text-2xl'>Notification Details</p>
      </div>
      <div className='flex flex-col flex-1 w-full px-6 py-6 text-gray-600'>
        <Link
          href='/logged/pages/notifications'
          className='self-start mb-6 px-4 py-2 text-blue-950 hover:text-blue-800 font-medium'
        >
          ← Back to Notifications
        </Link>

        <div className='flex flex-col w-full bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
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
          </div>

          <div className='border-t pt-6'>
            <label className='text-sm font-medium text-gray-500'>Full Description</label>
            <p className='text-base text-gray-900 mt-1 whitespace-pre-wrap'>{notification.notification_description}</p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationDetailPage;
