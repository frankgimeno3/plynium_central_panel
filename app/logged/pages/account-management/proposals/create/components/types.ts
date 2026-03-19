export type Customer = {
  id_customer: string;
  name: string;
  country?: string;
  contact?: { name: string; role: string; email: string; phone: string };
};

export type Contact = {
  id_contact: string;
  name: string;
  role?: string;
  email: string;
  phone: string;
  id_customer?: string;
  company_name?: string;
};

export type Service = {
  id_service: string;
  name: string;
  display_name?: string;
  description: string;
  tariff_price_eur: number;
  unit?: string;
};

export type ServiceLine = {
  lineId: string;
  id_service: string;
  description: string;
  specifications: string;
  units: number;
  discount_pct: number;
  price: number;
  /** Newsletter: month/year */
  publicationMonth?: number;
  publicationYear?: number;
  /** Portal banner / premium: date range */
  startDate?: string;
  endDate?: string;
  /** Magazine: publication + page type */
  id_planned_publication?: string;
  magazinePageType?: string;
  magazineSlotKey?: string;
};

export type Step = 1 | 2 | 3 | 4;

export type PaymentLine = {
  paymentId: string;
  date: string;
  paymentMethod: "recibo" | "transferencia_bancaria";
  bank: "Sabadell" | "Santander";
  amount: number;
};

export type ProposalForm = {
  id_customer: string;
  id_contact: string;
  additionalContactIds: string[];
  title: string;
  proposal_date: string;
  expiration_date: string;
  serviceLines: ServiceLine[];
  /** General discount mode (percentage or absolute €) */
  general_discount_mode: "pct" | "abs";
  general_discount_pct: number;
  general_discount_abs_eur: number;
  payments: PaymentLine[];
  /** Exchange mode: if true, show exchange terms instead of payments */
  isExchange: boolean;
  /** When isExchange: final exchange price toggle + value */
  exchangeHasFinalPrice: boolean;
  exchangeFinalPrice: number;
  /** When isExchange: bank transfer exchange */
  exchangeHasBankTransfers: boolean;
  exchangePlyniumTransferDate: string;
  exchangeCounterpartDate: string;
  exchangeTransferredAmount: number;
  /** Rich text: "To be received in exchange for our advertisement" */
  exchangeToBeReceivedHtml: string;
};

