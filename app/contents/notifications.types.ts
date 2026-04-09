/**
 * Unified notifications schema: all notification/request types share the same fields.
 * Fields not applicable for a type are empty string, empty array, or null.
 * 
 * Data is now fetched from RDS via /api/v1/notifications
 */
export type NotificationType = 'notification' | 'advertisement' | 'company' | 'other';

export type NotificationCategory = 'account_management' | 'production' | 'administration';

export type NotificationState =
  | 'unread'
  | 'read'
  | 'solved'
  | 'pending'
  | 'in_process'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'other';

export interface NotificationComment {
  date: string;
  content: string;
  /** Present when comment is associated to an agent row */
  agent_id?: string;
}

export interface CompanyContent {
  nombre_comercial: string;
  nombre_fiscal: string;
  tax_id: string;
  cargo_creador: string;
  web_empresa: string;
  pais_empresa: string;
  descripcion_empresa: string;
}

export interface UnifiedNotification {
  id: string;
  notification_type: NotificationType;
  notification_category: NotificationCategory | null;
  state: NotificationState;
  date: string;
  brief_description: string;
  description: string;
  sender_email: string;
  sender_company: string;
  sender_contact_phone: string;
  country: string;
  comments: NotificationComment[];
  user_id: string;
  company_content: CompanyContent | null;
}

/** Fetch all notifications from the API */
export async function fetchNotifications(filters?: {
  notification_type?: NotificationType;
  notification_category?: NotificationCategory;
  state?: NotificationState;
}): Promise<UnifiedNotification[]> {
  const params = new URLSearchParams();
  if (filters?.notification_type) params.set('notification_type', filters.notification_type);
  if (filters?.notification_category) params.set('notification_category', filters.notification_category);
  if (filters?.state) params.set('state', filters.state);
  
  const url = `/api/v1/notifications${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
}

/** Fetch a single notification by ID */
export async function fetchNotificationById(id: string): Promise<UnifiedNotification> {
  const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to fetch notification ${id}`);
  return res.json();
}

/** Update a notification */
export async function updateNotificationApi(id: string, data: Partial<UnifiedNotification>): Promise<UnifiedNotification> {
  const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to update notification ${id}`);
  return res.json();
}

/** Add a comment to a notification */
export async function addNotificationComment(id: string, content: string): Promise<UnifiedNotification> {
  const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ add_comment: content })
  });
  if (!res.ok) throw new Error(`Failed to add comment to notification ${id}`);
  return res.json();
}

/** Advertisement state as shown in UI (e.g. "in process" with space) */
export type AdvertisementStateDisplay =
  | 'pending'
  | 'in process'
  | 'accepted'
  | 'rejected'
  | 'expired';

/** Company/Other state as shown in UI (e.g. "Pending", "In Process") */
export type RequestStateDisplay = 'Pending' | 'In Process' | 'Other' | 'Done';

/** Notification state as shown in UI */
export type NotificationStateDisplay = 'unread' | 'read' | 'solved';

function stateToAdvertisementDisplay(state: NotificationState): AdvertisementStateDisplay {
  if (state === 'in_process') return 'in process';
  if (state === 'pending' || state === 'accepted' || state === 'rejected' || state === 'expired') return state;
  return 'pending';
}

function stateToCompanyDisplay(state: NotificationState): RequestStateDisplay {
  if (state === 'pending') return 'Pending';
  if (state === 'in_process') return 'In Process';
  if (state === 'other') return 'Other';
  return 'Pending';
}

function stateToNotificationDisplay(state: NotificationState): NotificationStateDisplay {
  if (state === 'unread' || state === 'read' || state === 'solved') return state;
  return 'unread';
}

export function getByNotificationType(
  data: UnifiedNotification[],
  type: NotificationType
): UnifiedNotification[] {
  return data.filter((r) => r.notification_type === type);
}

export function getPendingRequests(data: UnifiedNotification[]) {
  return {
    advertisement: getByNotificationType(data, 'advertisement').filter((r) => r.state === 'pending'),
    company: getByNotificationType(data, 'company').filter((r) => r.state === 'pending'),
    other: getByNotificationType(data, 'other').filter((r) => r.state === 'pending'),
  };
}

export function getNotifications(data: UnifiedNotification[]) {
  return getByNotificationType(data, 'notification');
}

export function getNotificationsByCategory(data: UnifiedNotification[], category: NotificationCategory) {
  return getByNotificationType(data, 'notification').filter((r) => r.notification_category === category);
}

export function getUnreadNotifications(data: UnifiedNotification[]) {
  return getByNotificationType(data, 'notification').filter((r) => r.state === 'unread');
}

export function getUnreadNotificationsByCategory(data: UnifiedNotification[], category: NotificationCategory) {
  return getNotificationsByCategory(data, category).filter((r) => r.state === 'unread');
}

/** Map unified notification to legacy AdvertisementRequest shape */
export function unifiedToAdvertisement(r: UnifiedNotification): {
  idAdvReq: string;
  senderEmail: string;
  senderDate: string;
  senderCompany: string;
  advReqState: AdvertisementStateDisplay;
  requestDescription: string;
  companyCountry: string;
  senderContactPhone: string;
  commentsArray: NotificationComment[];
} {
  return {
    idAdvReq: r.id,
    senderEmail: r.sender_email,
    senderDate: r.date,
    senderCompany: r.sender_company,
    advReqState: stateToAdvertisementDisplay(r.state),
    requestDescription: r.description,
    companyCountry: r.country,
    senderContactPhone: r.sender_contact_phone,
    commentsArray: r.comments ?? [],
  };
}

/** Map unified notification to legacy CompanyRequest shape */
export function unifiedToCompany(r: UnifiedNotification): {
  companyRequestId: string;
  userId: string;
  request_date: string;
  request_state: RequestStateDisplay;
  content: CompanyContent;
} {
  const content = r.company_content ?? {
    nombre_comercial: '',
    nombre_fiscal: '',
    tax_id: '',
    cargo_creador: '',
    web_empresa: '',
    pais_empresa: '',
    descripcion_empresa: '',
  };
  return {
    companyRequestId: r.id,
    userId: r.user_id,
    request_date: r.date,
    request_state: stateToCompanyDisplay(r.state),
    content,
  };
}

/** Map unified notification to legacy OtherRequest shape */
export function unifiedToOther(r: UnifiedNotification): {
  id: string;
  author: string;
  content: string;
  request_state: RequestStateDisplay;
} {
  const author = r.sender_email
    ? `${r.sender_company} - ${r.sender_email}`
    : r.sender_company || r.id;
  return {
    id: r.id,
    author,
    content: r.description,
    request_state: stateToCompanyDisplay(r.state),
  };
}

/** Map unified notification to legacy Notification shape */
export function unifiedToNotification(r: UnifiedNotification): {
  notification_id: string;
  notification_brief_description: string;
  notification_time: string;
  notification_state: NotificationStateDisplay;
  notification_description: string;
} {
  return {
    notification_id: r.id,
    notification_brief_description: r.brief_description,
    notification_time: r.date,
    notification_state: stateToNotificationDisplay(r.state),
    notification_description: r.description,
  };
}

/** Map display state back to unified state (for updates) */
export function advertisementStateToUnified(s: AdvertisementStateDisplay): NotificationState {
  if (s === 'in process') return 'in_process';
  return s;
}

export function companyStateToUnified(s: RequestStateDisplay): NotificationState {
  if (s === 'Pending') return 'pending';
  if (s === 'In Process') return 'in_process';
  if (s === 'Other') return 'other';
  return 'pending';
}

export function notificationStateToUnified(s: NotificationStateDisplay): NotificationState {
  return s;
}
