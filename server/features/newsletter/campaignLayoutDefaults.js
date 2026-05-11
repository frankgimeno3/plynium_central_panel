const LAYOUT_NEWSLETTER_TYPES = new Set(["main", "specific", "magazine"]);
const MAGAZINE_HEADER_MODES = new Set([
  "magazine_as_header",
  "normal_header_and_magazine_in_content",
]);

export function createDefaultCampaignLayoutConfig(newsletterType = "main") {
  const normalizedType = LAYOUT_NEWSLETTER_TYPES.has(String(newsletterType).trim().toLowerCase())
    ? String(newsletterType).trim().toLowerCase()
    : "main";

  return {
    newsletterType: normalizedType,
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

export function normalizeCampaignLayoutConfig(raw, campaignNewsletterType) {
  const fallbackType =
    String(campaignNewsletterType ?? "main").trim().toLowerCase() === "specific" ? "specific" : "main";
  const defaults = createDefaultCampaignLayoutConfig(fallbackType);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return defaults;
  }

  const newsletterTypeRaw = String(raw.newsletterType ?? defaults.newsletterType).trim().toLowerCase();
  const newsletterType = LAYOUT_NEWSLETTER_TYPES.has(newsletterTypeRaw) ? newsletterTypeRaw : defaults.newsletterType;
  const magazineHeaderModeRaw = String(raw.magazineHeaderMode ?? defaults.magazineHeaderMode).trim();
  const magazineHeaderMode = MAGAZINE_HEADER_MODES.has(magazineHeaderModeRaw)
    ? magazineHeaderModeRaw
    : defaults.magazineHeaderMode;

  const readString = (key) => {
    const value = raw[key];
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
