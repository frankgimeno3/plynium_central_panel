"use client";

import { FC, useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usePageContent } from '@/app/logged/logged_components/context_content/PageContentContext';
import PageContentSection from '@/app/logged/logged_components/context_content/PageContentSection';
import {
  fetchNotifications,
  fetchNotificationById,
  updateNotificationApi,
  addNotificationComment,
  unifiedToNotification,
  type UnifiedNotification,
  type NotificationComment,
} from '@/app/contents/notifications.types';
import { CustomerService } from '@/app/service/CustomerService';

type NotificationState = 'unread' | 'read' | 'solved';

interface Notification {
  notification_id: string;
  notification_brief_description: string;
  notification_time: string;
  notification_state: NotificationState;
  notification_description: string;
}

/** Parses `panel_ticket_full_description` and returns a related in-app link when applicable. */
function getRedirectionLink(
  description: string,
  customers: { id_customer: string; name: string; contact?: { name: string } }[],
  otherRequestsData: { id: string; author: string }[]
): { href: string; label: string } | null {
  const d = description || '';
  const oreqMatch = d.match(/Request ID:\s*(\S+)/i) || d.match(/\b(oreq-\d+)\b/i);
  const creqMatch = d.match(/\b(creq-\d+)\b/i);
  const advMatch = d.match(/\b(adv-\d+-\d+)\b/i) || d.match(/\b(adv-\d+-\d{4})\b/i);

  const isCompanyProfile = /\bcompany profile\b/i.test(d) && (/\bDirectory\b/i.test(d) || /\bdirectory update\b/i.test(d));
  if (isCompanyProfile && oreqMatch) {
    const oreqId = (oreqMatch[1] || '').trim();
    const req = otherRequestsData.find((r) => r.id === oreqId);
    if (req) {
      const authorName = req.author.split(/\s*[-–]\s*/)[0]?.trim() || '';
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
        href: `/logged/pages/tickets/other/${encodeURIComponent(oreqId)}`,
        label: `Ver solicitud Other: ${oreqId}`,
      };
    }
  }

  if (creqMatch) {
    const id = creqMatch[1].trim();
    return {
      href: `/logged/pages/tickets/company/${encodeURIComponent(id)}`,
      label: `Ver solicitud de empresa: ${id}`,
    };
  }
  if (advMatch) {
    const id = advMatch[1].trim();
    return {
      href: `/logged/pages/tickets/quotations/${encodeURIComponent(id)}`,
      label: `Ver solicitud de publicidad: ${id}`,
    };
  }
  if (oreqMatch) {
    const id = (oreqMatch[1] || '').trim();
    if (id) {
      return {
        href: `/logged/pages/tickets/other/${encodeURIComponent(id)}`,
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
  const idParam = params?.ticket_id;
  const ticketId = Array.isArray(idParam) ? idParam[0] : (idParam as string) || '';

  const [unified, setUnified] = useState<UnifiedNotification | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [localState, setLocalState] = useState<NotificationState>('unread');
  const [customers, setCustomers] = useState<{ id_customer: string; name: string; contact?: { name: string } }[]>([]);
  const [otherRequestsData, setOtherRequestsData] = useState<{ id: string; author: string }[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [isSavingComment, setIsSavingComment] = useState(false);

  useEffect(() => {
    CustomerService.getAllCustomers().then((l) => setCustomers(Array.isArray(l) ? l : [])).catch(() => setCustomers([]));
  }, []);

  useEffect(() => {
    fetchNotifications({ notification_type: 'other' })
      .then((data) => {
        const mapped = data.map((r) => ({
          id: r.id,
          author: r.sender_company ?? '',
        }));
        setOtherRequestsData(mapped);
      })
      .catch(() => setOtherRequestsData([]));
  }, []);

  useEffect(() => {
    if (!ticketId) return;
    setLoading(true);
    const decodedId = decodeURIComponent(ticketId).trim();
    fetchNotificationById(decodedId)
      .then((data) => {
        setUnified(data);
        const mapped = unifiedToNotification(data);
        setNotification(mapped);
        setLocalState(mapped.notification_state);
      })
      .catch(() => {
        setUnified(null);
        setNotification(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ticketId]);

  const handleStateChange = (newState: NotificationState) => {
    if (!notification) return;
    setLocalState(newState);
    setNotification({ ...notification, notification_state: newState });
    updateNotificationApi(notification.notification_id, { state: newState })
      .catch(console.error);
  };

  const stateOptions: NotificationState[] = ['unread', 'read', 'solved'];

  const breadcrumbsList = [
    { label: 'Tickets', href: '/logged/pages/tickets' },
    { label: notification?.notification_brief_description ?? ticketId ?? 'Detail' },
  ];

  const { setPageMeta } = usePageContent();
  useEffect(() => {
    if (!loading && !notification) {
      setPageMeta({
        pageTitle: 'Ticket not found',
        breadcrumbs: [{ label: 'Tickets', href: '/logged/pages/tickets' }, { label: 'Not found' }],
        buttons: [{ label: 'Back to Tickets', href: '/logged/pages/tickets' }],
      });
    } else if (loading) {
      setPageMeta({ pageTitle: 'Ticket', breadcrumbs: [{ label: 'Tickets', href: '/logged/pages/tickets' }] });
    } else {
      setPageMeta({
        pageTitle: 'Ticket Details',
        breadcrumbs: breadcrumbsList,
        buttons: [{ label: 'Back to Tickets', href: '/logged/pages/tickets' }],
      });
    }
  }, [notification, loading, ticketId, setPageMeta]);

  if (!loading && !notification) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-red-500 text-lg">Ticket not found.</p>
              <Link href="/logged/pages/tickets" className="mt-4 inline-block text-blue-950 hover:underline">
                Back to Tickets
              </Link>
            </div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  if (loading || !notification) {
    return (
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6 text-center text-gray-600">Loading...</div>
          </div>
        </div>
      </PageContentSection>
    );
  }

  const comments: NotificationComment[] = useMemo(() => {
    const list = unified?.comments ?? [];
    return [...list].sort((a, b) => {
      const ta = Date.parse(a.date || '') || 0;
      const tb = Date.parse(b.date || '') || 0;
      return ta - tb;
    });
  }, [unified?.comments]);

  const handleAddComment = async () => {
    if (!unified) return;
    const content = commentDraft.trim();
    if (!content) return;
    try {
      setIsSavingComment(true);
      const updated = await addNotificationComment(unified.id, content);
      setUnified(updated);
      setCommentDraft('');
    } finally {
      setIsSavingComment(false);
    }
  };

  const redirectionLink = getRedirectionLink(notification.notification_description, customers, otherRequestsData);

  return (
    <>
      <PageContentSection>
        <div className="flex flex-col w-full">
          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-6">
        <div className="space-y-4 mb-6">
            <div>
              <label className='text-sm font-medium text-gray-500'>Ticket ID</label>
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
                <p className='text-base text-gray-500 mt-1'>There is no link for this ticket.</p>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            <label className="text-sm font-medium text-gray-500">Full Description</label>
            <p className="text-base text-gray-900 mt-1 whitespace-pre-wrap">{notification.notification_description}</p>
          </div>

          <div className="border-t pt-6 mt-6">
            <label className="text-sm font-medium text-gray-500">Comments</label>

            <div className="mt-3 space-y-3">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-sm">No comments yet.</p>
              ) : (
                comments.map((c, idx) => (
                  <div key={`${c.date}-${idx}`} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-gray-500">{formatNotificationTime(c.date)}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.agent_id ? `agent: ${c.agent_id}` : 'agent: —'}</p>
                    </div>
                    <p className="text-sm text-gray-900 mt-2 whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Add a comment</label>
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-950 focus:border-blue-950 text-gray-900"
                placeholder="Write a note for this ticket..."
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddComment}
                  disabled={isSavingComment || commentDraft.trim().length === 0}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isSavingComment || commentDraft.trim().length === 0
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-950 text-white hover:bg-blue-900'
                  }`}
                >
                  {isSavingComment ? 'Saving...' : 'Add comment'}
                </button>
              </div>
            </div>
          </div>
            </div>
          </div>
        </div>
      </PageContentSection>
    </>
  );
};

export default NotificationDetailPage;
