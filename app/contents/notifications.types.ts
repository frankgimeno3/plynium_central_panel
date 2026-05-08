/**
 * Unified panel ticket schema (RDS `panel_tickets` + related tables).
 * Inbox tickets previously stored as `panel_ticket_type = notification` + `panel_ticket_category`
 * are now a single `panel_ticket_type` value: `account_management` | `production` | `administration`.
 *
 * HTTP routes remain `/api/v1/notifications` for backward compatibility; handlers map to `panel_*` columns.
 */
export type InboxNotificationType = 'account_management' | 'production' | 'administration';

export type NotificationType =
  | InboxNotificationType
  | 'advertisement'
  | 'company'
  | 'product'
  | 'other';

/** @deprecated Use InboxNotificationType; kept for imports that still name “category”. */
export type NotificationCategory = InboxNotificationType;

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
  list_as_employee?: boolean;
}

/** One row in `panel_ticket_advertisement` (mediakit / advertise form). */
export interface AdvertisementRequestPayload {
  contact_full_name: string;
  contact_email: string;
  company_country: string;
  phone_country_prefix: string;
  phone_number: string;
  interest: string;
  message: string;
  terms_accepted: boolean;
  services_array: string[];
}

/** Entries appended to `panel_ticket_updates_array` (e.g. directory fulfillment). */
export type PanelTicketUpdateEntry = {
  action?: string;
  company_id?: string;
  fulfilled_at?: string;
};

export interface UnifiedNotification {
  id: string;
  notification_type: NotificationType;
  state: NotificationState;
  date: string;
  brief_description: string;
  description: string;
  /** Set by PUT after company-directory fulfillment so the client can redirect without parsing JSONB. */
  fulfilled_company_id?: string;
  interest?: string;
  /** Populated for `advertisement` tickets from `panel_ticket_advertisement.services_array`. */
  services_array?: string[];
  sender_email: string;
  sender_company: string;
  sender_contact_phone: string;
  country: string;
  comments: NotificationComment[];
  user_id: string;
  company_content: CompanyContent | null;
  product_content?: ProductContent | null;
  /** Present when joined from `panel_ticket_advertisement` (advertisement tickets). */
  advertisement_request?: AdvertisementRequestPayload | null;
  /** RDS `panel_ticket_updates_array`; includes `company_directory_fulfilled` with `company_id`. */
  panel_ticket_updates_array?: PanelTicketUpdateEntry[];
}

/** Normalizes JSONB / API payloads that may be an array or a JSON string. */
export function panelTicketUpdatesAsArray(
  updates: PanelTicketUpdateEntry[] | string | undefined | null
): PanelTicketUpdateEntry[] {
  if (!updates) return [];
  if (Array.isArray(updates)) return updates;
  if (typeof updates === 'string') {
    try {
      const parsed = JSON.parse(updates) as unknown;
      return Array.isArray(parsed) ? (parsed as PanelTicketUpdateEntry[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** After company directory fulfillment, the new RDS `company_id` is stored on the ticket updates. */
export function fulfilledCompanyIdFromPanelTicketUpdates(
  updates: PanelTicketUpdateEntry[] | string | undefined | null
): string | null {
  const list = panelTicketUpdatesAsArray(updates);
  if (list.length === 0) return null;
  for (let i = list.length - 1; i >= 0; i--) {
    const e = list[i];
    if (!e || typeof e !== 'object') continue;
    if (String((e as { action?: string }).action) === 'company_directory_fulfilled') {
      const raw = (e as { company_id?: unknown }).company_id;
      const cid = typeof raw === 'string' ? raw : raw != null ? String(raw) : '';
      if (cid.trim()) return cid.trim();
    }
  }
  return null;
}

export interface ProductContent {
  product_id?: string;
  product_name: string;
  product_description: string;
  product_price: number;
  company_id: string;
  product_main_image_src: string;
  product_categories_array: string[];
  updated_at?: string;
}

/** Fetch all notifications from the API */
export async function fetchNotifications(filters?: {
  notification_type?: NotificationType;
  /** Legacy query param: maps to `notification_type` on the server when `notification_type` is omitted. */
  notification_category?: InboxNotificationType;
  state?: NotificationState;
}): Promise<UnifiedNotification[]> {
  const params = new URLSearchParams();
  if (filters?.notification_type) params.set('notification_type', filters.notification_type);
  if (filters?.notification_category) params.set('notification_category', filters.notification_category);
  if (filters?.state) params.set('state', filters.state);
  
  const url = `/api/v1/notifications${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    credentials: 'include',
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
  });
  if (!res.ok) {
    let details = '';
    try {
      details = (await res.text())?.trim();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to fetch notifications (${res.status} ${res.statusText})${details ? `: ${details}` : ''}`
    );
  }
  return res.json();
}

const ticketFetchInit: RequestInit = {
  credentials: 'include',
  signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
};

/** Fetch a single panel ticket by id (`panel_ticket_id`) */
export async function fetchNotificationById(id: string): Promise<UnifiedNotification> {
  const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`, ticketFetchInit);
  if (!res.ok) {
    let details = '';
    try {
      details = (await res.text())?.trim();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to fetch ticket ${id} (${res.status} ${res.statusText})${details ? `: ${details}` : ''}`
    );
  }
  return res.json();
}

/** Body for PUT `/api/v1/notifications/:id` (ticket fields plus optional fulfill hint). */
export type PanelTicketUpdatePayload = Partial<UnifiedNotification> & {
  fulfill_portal_id?: number;
  fulfill_portal_ids?: number[];
  add_comment?: string;
  fulfill_product?: boolean;
};

/** Update a panel ticket row (e.g. `panel_ticket_state`) */
export async function updateNotificationApi(id: string, data: PanelTicketUpdatePayload): Promise<UnifiedNotification> {
  const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
  });
  if (!res.ok) {
    let details = '';
    try {
      details = (await res.text())?.trim();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to update ticket ${id} (${res.status} ${res.statusText})${details ? `: ${details}` : ''}`
    );
  }
  return res.json();
}

/** Append a row to `panel_ticket_comments` for this ticket */
export async function addNotificationComment(id: string, content: string): Promise<UnifiedNotification> {
  const res = await fetch(`/api/v1/notifications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ add_comment: content }),
    signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(45000) : undefined,
  });
  if (!res.ok) {
    let details = '';
    try {
      details = (await res.text())?.trim();
    } catch {
      // ignore
    }
    throw new Error(
      `Failed to add comment on ticket ${id} (${res.status} ${res.statusText})${details ? `: ${details}` : ''}`
    );
  }
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
  if (state === 'solved') return 'Done';
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

const INBOX_TYPES: InboxNotificationType[] = ['account_management', 'production', 'administration'];

export function getNotifications(data: UnifiedNotification[]) {
  return data.filter((r) => INBOX_TYPES.includes(r.notification_type as InboxNotificationType));
}

export function getNotificationsByCategory(data: UnifiedNotification[], category: InboxNotificationType) {
  return data.filter((r) => r.notification_type === category);
}

export function getUnreadNotifications(data: UnifiedNotification[]) {
  return getNotifications(data).filter((r) => r.state === 'unread');
}

export function getUnreadNotificationsByCategory(data: UnifiedNotification[], category: InboxNotificationType) {
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
  interest: string;
  serviceIds: string[];
  commentsArray: NotificationComment[];
} {
  return {
    idAdvReq: r.id,
    senderEmail: r.sender_email,
    senderDate: r.date,
    senderCompany: r.sender_company,
    advReqState: stateToAdvertisementDisplay(r.state),
    requestDescription: r.description,
    companyCountry:
      (r.advertisement_request?.company_country && String(r.advertisement_request.company_country).trim()) ||
      r.country ||
      '',
    senderContactPhone: r.sender_contact_phone,
    interest: r.interest ?? '',
    serviceIds: Array.isArray(r.advertisement_request?.services_array)
      ? r.advertisement_request.services_array
      : Array.isArray(r.services_array)
        ? r.services_array
        : [],
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
  commentsArray: NotificationComment[];
} {
  const content = r.company_content ?? {
    nombre_comercial: '',
    nombre_fiscal: '',
    tax_id: '',
    cargo_creador: '',
    web_empresa: '',
    pais_empresa: '',
    descripcion_empresa: '',
    list_as_employee: false,
  };
  return {
    companyRequestId: r.id,
    userId: r.user_id,
    request_date: r.date,
    request_state: stateToCompanyDisplay(r.state),
    content,
    commentsArray: r.comments ?? [],
  };
}

/** Map unified notification to legacy OtherRequest shape */
export function unifiedToOther(r: UnifiedNotification): {
  id: string;
  author: string;
  content: string;
  request_state: RequestStateDisplay;
  commentsArray: NotificationComment[];
} {
  const author = r.sender_email
    ? `${r.sender_company} - ${r.sender_email}`
    : r.sender_company || r.id;
  return {
    id: r.id,
    author,
    content: r.description,
    request_state: stateToCompanyDisplay(r.state),
    commentsArray: r.comments ?? [],
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
