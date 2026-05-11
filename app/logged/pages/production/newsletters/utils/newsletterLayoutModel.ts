import type { Newsletter, NewsletterCampaign, NewsletterContentBlock } from "@/app/contents/interfaces";
import {
  createDefaultNewsletterCampaignLayoutConfig,
  normalizeNewsletterCampaignLayoutConfig,
  type NewsletterCampaignLayoutConfig,
} from "@/app/contents/newsletterCampaignLayout";

export type NewsletterContentKind = "article" | "sponsored" | "banner";

export type NewsletterContentItem = {
  id: string;
  position: number;
  kind: NewsletterContentKind;
  imageSrc: string;
  title: string;
  subtitle: string;
  redirection: string;
  projectId?: string;
  projectTitle?: string;
};

export function isNewsletterSpecificContentBlock(block: NewsletterContentBlock): boolean {
  return block.type === "portal_article_preview" || block.type === "banner";
}

export function resolveCampaignLayout(
  campaign: NewsletterCampaign | null
): NewsletterCampaignLayoutConfig {
  if (campaign?.layoutConfig) {
    return normalizeNewsletterCampaignLayoutConfig(campaign.layoutConfig, campaign.newsletterType);
  }
  return createDefaultNewsletterCampaignLayoutConfig(
    campaign?.newsletterType === "specific" ? "specific" : "main"
  );
}

export function resolveEffectiveNewsletterLayout(
  campaign: NewsletterCampaign | null,
  newsletter: Newsletter
): NewsletterCampaignLayoutConfig {
  if (newsletter.layoutEditionConfig) {
    return normalizeNewsletterCampaignLayoutConfig(
      newsletter.layoutEditionConfig,
      campaign?.newsletterType
    );
  }
  return resolveCampaignLayout(campaign);
}

export function mapBlocksToContentItems(blocks: NewsletterContentBlock[]): NewsletterContentItem[] {
  return blocks
    .filter(isNewsletterSpecificContentBlock)
    .sort((a, b) => a.order - b.order)
    .map((block, index) => {
      const data = block.data as Record<string, unknown>;

      if (block.type === "banner") {
        const projectId = String(data.projectId ?? "");
        const projectTitle = String(data.projectTitle ?? "");
        return {
          id: block.id,
          position: index + 1,
          kind: "banner",
          imageSrc: String(data.imageSrc ?? ""),
          title: String(data.alt ?? data.title ?? projectTitle ?? "Banner"),
          subtitle: projectTitle ? `Project: ${projectTitle}` : "Banner",
          redirection: String(data.redirectUrl ?? data.link ?? data.redirection ?? ""),
          projectId: projectId || undefined,
          projectTitle: projectTitle || undefined,
        };
      }

      const isSponsored =
        data.isSponsored === true || String(data.contentKind ?? "").trim().toLowerCase() === "sponsored";

      return {
        id: block.id,
        position: index + 1,
        kind: isSponsored ? "sponsored" : "article",
        imageSrc: String(data.imageSrc ?? ""),
        title: String(data.title ?? ""),
        subtitle: String(data.briefing ?? data.subtitle ?? ""),
        redirection: String(data.link ?? data.redirection ?? ""),
      };
    });
}
