export type LayoutNewsletterType = "main" | "specific" | "magazine";

export type MagazineHeaderMode = "magazine_as_header" | "normal_header_and_magazine_in_content";

export type NewsletterCampaignLayoutConfig = {
  newsletterType: LayoutNewsletterType;
  magazineHeaderMode: MagazineHeaderMode;
  headerBackground: string;
  headerLogoLabel: string;
  headerTextRight: string;
  headerSubtitle: string;
  headerTextColor: string;
  magazinePortalId: string;
  magazineId: string;
  magazinePublicationId: string;
  magazineContentBackground: string;
  magazineContentTextColor: string;
  summaryBackground: string;
  summaryTextColor: string;
  contentSectionBackground: string;
  titleFont: string;
  subtitleFont: string;
  titleTextColor: string;
  subtitleTextColor: string;
  buttonColor: string;
  buttonTextColor: string;
  footerColor: string;
  footerTextColor: string;
  footerContactEmail: string;
  footerLinkedinLink: string;
  footerWebsite: string;
  footerContactPhone: string;
  footerUnsubscribeEmail: string;
};

export function createDefaultNewsletterCampaignLayoutConfig(
  newsletterType: LayoutNewsletterType = "main"
): NewsletterCampaignLayoutConfig {
  return {
    newsletterType,
    magazineHeaderMode: "magazine_as_header",
    headerBackground: "#003c7a",
    headerLogoLabel: "Portal News",
    headerTextRight: "PORTAL EDITION",
    headerSubtitle: "Issue 12 · May 2026 · newsletter",
    headerTextColor: "#ffffff",
    magazinePortalId: "",
    magazineId: "",
    magazinePublicationId: "",
    magazineContentBackground: "#f3f4f6",
    magazineContentTextColor: "#111827",
    summaryBackground: "#e8e4dc",
    summaryTextColor: "#b8860b",
    contentSectionBackground: "#ffffff",
    titleFont: "Arial, Helvetica, sans-serif",
    subtitleFont: "Georgia, serif",
    titleTextColor: "#111827",
    subtitleTextColor: "#374151",
    buttonColor: "#c62828",
    buttonTextColor: "#ffffff",
    footerColor: "#003c7a",
    footerTextColor: "#ffffff",
    footerContactEmail: "contact@example.com",
    footerLinkedinLink: "https://www.linkedin.com/company/example",
    footerWebsite: "https://www.example.com",
    footerContactPhone: "+34 93 000 00 00",
    footerUnsubscribeEmail: "unsubscribe@example.com",
  };
}

export function normalizeNewsletterCampaignLayoutConfig(
  raw: unknown,
  campaignNewsletterType?: string | null
): NewsletterCampaignLayoutConfig {
  const fallbackType =
    String(campaignNewsletterType ?? "main").trim().toLowerCase() === "specific" ? "specific" : "main";
  const defaults = createDefaultNewsletterCampaignLayoutConfig(fallbackType);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const source = raw as Record<string, unknown>;
  const newsletterTypeRaw = String(source.newsletterType ?? defaults.newsletterType).trim().toLowerCase();
  const newsletterType: LayoutNewsletterType =
    newsletterTypeRaw === "magazine" || newsletterTypeRaw === "specific" ? newsletterTypeRaw : "main";
  const magazineHeaderModeRaw = String(source.magazineHeaderMode ?? defaults.magazineHeaderMode).trim();
  const magazineHeaderMode: MagazineHeaderMode =
    magazineHeaderModeRaw === "normal_header_and_magazine_in_content"
      ? "normal_header_and_magazine_in_content"
      : "magazine_as_header";

  const readString = (key: keyof NewsletterCampaignLayoutConfig) => {
    const value = source[key];
    return typeof value === "string" ? value : defaults[key];
  };

  return {
    newsletterType,
    magazineHeaderMode,
    headerBackground: readString("headerBackground"),
    headerLogoLabel: readString("headerLogoLabel"),
    headerTextRight: readString("headerTextRight"),
    headerSubtitle: readString("headerSubtitle"),
    headerTextColor: readString("headerTextColor"),
    magazinePortalId: readString("magazinePortalId"),
    magazineId: readString("magazineId"),
    magazinePublicationId: readString("magazinePublicationId"),
    magazineContentBackground: readString("magazineContentBackground"),
    magazineContentTextColor: readString("magazineContentTextColor"),
    summaryBackground: readString("summaryBackground"),
    summaryTextColor: readString("summaryTextColor"),
    contentSectionBackground: readString("contentSectionBackground"),
    titleFont: readString("titleFont"),
    subtitleFont: readString("subtitleFont"),
    titleTextColor: readString("titleTextColor"),
    subtitleTextColor: readString("subtitleTextColor"),
    buttonColor: readString("buttonColor"),
    buttonTextColor: readString("buttonTextColor"),
    footerColor: readString("footerColor"),
    footerTextColor: readString("footerTextColor"),
    footerContactEmail: readString("footerContactEmail"),
    footerLinkedinLink: readString("footerLinkedinLink"),
    footerWebsite: readString("footerWebsite"),
    footerContactPhone: readString("footerContactPhone"),
    footerUnsubscribeEmail: readString("footerUnsubscribeEmail"),
  };
}
