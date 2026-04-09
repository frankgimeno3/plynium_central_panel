export interface articleInterface {
  id_article: string;
  articleTitle: string;
  articleSubtitle: string;
  article_main_image_url: string;
  article_tags_array: string[];
  contents_array: string[];
  /** Comma-separated display; prefer article_company_names_array */
  company: string;
  article_company_names_array?: string[];
  article_company_id_array?: string[];
  date: string;
  highlited_position?: string;
  is_article_event?: boolean;
  event_id?: string;
  /** Company IDs linked in this article (redirections to company pages) */
  article_company_redirections?: string[];
  /** Product IDs linked in this article (redirections to product pages) */
  article_product_redirections?: string[];
}
/** Miniature/card view of an article (content title, subtitle, image) */
export interface articleMiniatureInterface {
    /** Content title */
    contenidoTitulo: string;
    /** Content subtitle */
    contenidoSubtitulo: string;
    /** Image URL */
    url_imagen: string;
}

/** Slot for a page (cover, inside_cover, end or a numbered page). Aligns with publication_slots_db. */
export interface PublicationSlot {
  publication_slot_id?: number;
  publication_id?: string | null;
  /** Display surface: flipbook (viewer) or informer (other). */
  publication_format?: "flipbook" | "informer";
  slot_key?: string;
  slot_content_type: string;
  slot_state: string;
  customer_id?: string;
  project_id?: string;
  slot_media_url?: string;
  slot_article_id?: string;
  slot_created_at?: string;
  slot_updated_at?: string;
}

/** Row in offered_preferential_pages (preferential ad page offered on a proposal). */
export interface OfferedPreferentialPage {
  offeredPageId?: string;
  pageType: string;
  slotKey: string;
  publicationId?: string | null;
  publicationSlotId?: number | null;
  agentId?: string | null;
  customerId?: string | null;
  proposalId?: string | null;
  offeredPageProposalDate?: string | null;
}

/** Single unified publication: planned | in production | published. All fields present; blank when not applicable. */
export type PublicationState = "planned" | "in production" | "published";

export interface PublicationUnified {
  state: PublicationState;
  id_publication: string;
  id_planned_publication: string;
  id_flatplan: string;
  edition_name: string;
  theme: string;
  date: string;
  publication_date: string;
  redirectionLink: string;
  revista: string;
  número: string;
  publication_main_image_url: string;
  id_magazine: string;
  year: number | null;
  issue_number: number | null;
  cover: PublicationSlot | null;
  inside_cover: PublicationSlot | null;
  end: PublicationSlot | null;
  /** Rest of pages (numbered slots 1, 2, 3, ...) as array. */
  pages: PublicationSlot[];
  single_available: { state: string; offeredInProposal?: unknown[] } | null;
  offeredPreferentialPages: OfferedPreferentialPage[];
}

/** Publication (published issue). Use PublicationUnified filtered by state === "published" or this for backward compat. */
export interface publicationInterface {
  state?: PublicationState;
  id_publication: string;
  id_planned_publication?: string;
  id_flatplan?: string;
  redirectionLink: string;
  date: string;
  revista: string;
  número: number | string;
  publication_main_image_url: string;
  edition_name?: string;
  theme?: string;
  publication_date?: string;
  id_magazine?: string;
  year?: number;
  issue_number?: number;
  cover?: PublicationSlot | null;
  inside_cover?: PublicationSlot | null;
  end?: PublicationSlot | null;
  pages?: PublicationSlot[];
  single_available?: { state: string; offeredInProposal?: unknown[] } | null;
  offeredPreferentialPages?: OfferedPreferentialPage[];
}

/** Planned issue for a magazine in a given year. */
export interface MagazineIssue {
  issue_number: number;
  is_special_edition: boolean;
  special_topic?: string;
  /** Forecasted publication month (1-12). Required when creating/editing; unique per magazine/year. */
  forecasted_publication_month?: number;
}

/** Magazine: container for years and issues (each issue can become a Published publication). */
export interface Magazine {
  id_magazine: string;
  name: string;
  description?: string;
  first_year?: number;
  /** e.g. monthly, quarterly */
  periodicity?: string;
  subscriber_number?: number;
  /** Planned issues per year. Key = year as string (e.g. "2025"). Client-only unless API persists. */
  issues_by_year?: Record<string, MagazineIssue[]>;
}

/** Flatplan slot (alias for PublicationSlot). */
export type FlatplanSlot = PublicationSlot;

/** Flatplan = PublicationUnified with state "in production". Kept for backward compat; use PublicationUnified + state. */
export interface Flatplan {
  id_flatplan: string;
  edition_name: string;
  theme: string;
  publication_date: string;
  id_magazine?: string;
  year?: number;
  issue_number?: number;
  description?: string;
  cover?: FlatplanSlot;
  inside_cover?: FlatplanSlot;
  end?: FlatplanSlot;
  pages?: PublicationSlot[];
  "1"?: FlatplanSlot;
  "2"?: FlatplanSlot;
  "3"?: FlatplanSlot;
  "4"?: FlatplanSlot;
  "5"?: FlatplanSlot;
  "6"?: FlatplanSlot;
  "7"?: FlatplanSlot;
  "8"?: FlatplanSlot;
  "9"?: FlatplanSlot;
  "10"?: FlatplanSlot;
  offeredPreferentialPages?: OfferedPreferentialPage[];
}

export interface Company {
  companyId: string;
  commercialName: string;
  country: string;
  category: string;
  mainDescription: string;
  mainImage: string;
  productsArray: string[];
  categoriesArray: string[];
  mainEmail: string;
  mailTelephone: string;
  fullAddress: string;
  webLink: string;
}

export interface CompanyBasic {
  companyId: string;
  commercialName: string;
}

export interface Product {
  productId: string;
  productName: string;
  price: number;
  company: string;
  productDescription: string;
  mainImageSrc: string;
  productCategoriesArray: string[];
}

/** Payment/order linked to an issued invoice. Format: CXX.000000Y-00Z (Z = serial) */
export interface Order {
  order_code: string;
  collection_date: string;
  status: 'paid' | 'pending';
  amount_eur: number;
  agent?: string;
  id_contact?: string;
}

/** Issued invoice belonging to a contract. A contract has at least one invoice. */
export interface IssuedInvoice {
  invoice_id: string;
  amount_eur: number;
  issue_date: string;
  payment_date?: string;
  invoice_state?: 'created' | 'ok' | 'cancelled';
  orders: Order[];
}

/** Contract code format: CXX.000000Y (XX = year, Y = serial) */
export interface AdministrationContract {
  contract_code: string;
  id_contract?: string;
  client_id: string;
  client_name: string;
  agent?: string;
  invoices: IssuedInvoice[];
}

/** Flat row for the administration super table: one row per order */
export interface OrderRow {
  order_code: string;
  contract_code: string;
  id_contract?: string;
  invoice_id: string;
  invoice_state?: 'created' | 'ok' | 'cancelled';
  collection_date: string;
  payment_status: 'paid' | 'pending';
  client_id: string;
  client_name: string;
  agent?: string;
  id_contact?: string;
  id_proposal?: string;
  amount_eur: number;
}

export interface Provider {
  id_provider: string;
  name: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  tax_id?: string;
  notes?: string;
}

/** Agent assigned to accounts (customers) and proposals. */
export interface Agent {
  id_agent: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface ProviderInvoice {
  id: string;
  id_provider: string;
  provider_name: string;
  amount_eur: number;
  payment_date: string;
}

// ——— Newsletter entities ———

/** Container for a set of newsletters with defined periodicity and time range. */
export interface NewsletterCampaign {
  id: string;
  name: string;
  description: string;
  portalCode: string;
  /** DB column newsletter_campaign (free text). */
  newsletterCampaign?: string;
  contentTheme: string;
  frequency: string;
  startDate: string;
  endDate: string;
  /** DB: newsletter_campaign_planned_publication_dates_array (ISO date strings). */
  plannedPublicationDates?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Newsletter status for filtering: calendarized | pending = scheduled; published | cancelled = finished. */
export type NewsletterStatus = "calendarized" | "pending" | "published" | "cancelled";

export interface Newsletter {
  id: string;
  campaignId: string;
  portalCode: string;
  estimatedPublishDate: string;
  /** Set when the newsletter was actually published (DB: newsletter_real_publication_date). */
  realPublicationDate?: string;
  topic: string;
  status: NewsletterStatus;
  /** User newsletter list id (from userLists) for scheduled/target send list. */
  userNewsletterListId?: string | null;
  sentToLists: string[] | null;
  createdAt: string;
  updatedAt: string;
}

/** Content block types for newsletter body. */
export type NewsletterContentBlockType =
  | "banner"
  | "portal_article_preview"
  | "header"
  | "footer"
  | "custom_content";

export interface NewsletterContentBlock {
  id: string;
  newsletterId: string;
  type: NewsletterContentBlockType;
  order: number;
  data: Record<string, unknown>;
}