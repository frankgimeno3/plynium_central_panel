/**
 * Upload a low-res article page PNG (Article Builder capture) into the article's
 * mediateca `Screenshots/` folder as `Screenshot-p{n}.png`, and mirror the CDN URL
 * on `publication_slots_db.slot_flatplan_image_url`.
 */

import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationArticleDbModel,
  PublicationModel,
  PublicationSlotDbModel,
} from "../../../../../../server/database/models.js";
import "../../../../../../server/database/models.js";
import {
  articlePageIndexForSlot,
  upsertArticlePageScreenshot,
} from "../../../../../../server/features/publication/ArticleScreenshotService.js";

export const runtime = "nodejs";

const postSchema = Joi.object({
  image_png_base64: Joi.string().trim().min(32).required(),
  publication_article_id: Joi.string().uuid().required(),
  article_page_index: Joi.number().integer().min(1).optional(),
});

function parsePngBase64(raw) {
  const s = String(raw ?? "").trim();
  const comma = s.indexOf(",");
  const payload = s.startsWith("data:") && comma >= 0 ? s.slice(comma + 1) : s;
  return Buffer.from(payload, "base64");
}

function getSlotIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/publication-slots\/([^/]+)\/article-flatplan-composite/);
  if (match?.[1]) return decodeURIComponent(match[1]);
  throw new Error("publication_slot_id not found in URL");
}

export const POST = createEndpoint(
  async (_request, body) => {
    const slotIdRaw = getSlotIdFromRequest(_request);
    const slotId = Number(slotIdRaw);
    if (!Number.isInteger(slotId) || slotId <= 0) {
      return NextResponse.json({ message: "Invalid publication_slot_id" }, { status: 400 });
    }

    const publicationArticleId = String(body.publication_article_id ?? "").trim();
    if (!publicationArticleId) {
      return NextResponse.json({ message: "publication_article_id is required" }, { status: 400 });
    }

    const slot = await PublicationSlotDbModel.findByPk(slotId);
    if (!slot) {
      return NextResponse.json({ message: "Publication slot not found" }, { status: 404 });
    }

    const slotPlain = slot.get({ plain: true });
    if (String(slotPlain.slot_content_type ?? "").trim().toLowerCase() !== "article") {
      return NextResponse.json(
        { message: "Flatplan capture applies only to article slots" },
        { status: 400 }
      );
    }

    const article = await PublicationArticleDbModel.findByPk(publicationArticleId);
    if (!article) {
      return NextResponse.json({ message: "Publication article not found" }, { status: 404 });
    }

    const ap = article.get({ plain: true });
    const slotIds = Array.isArray(ap.publication_slots_id_array)
      ? ap.publication_slots_id_array.map(Number).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    if (!slotIds.includes(slotId)) {
      return NextResponse.json(
        { message: "Slot is not part of this publication article" },
        { status: 400 }
      );
    }

    const publicationId = String(ap.publication_id ?? slotPlain.publication_id ?? "").trim();
    const networkArticleId = String(ap.article_id ?? slotPlain.slot_article_id ?? "").trim();
    if (!publicationId || !networkArticleId) {
      return NextResponse.json({ message: "Missing publication or article id" }, { status: 400 });
    }

    let pageIndex = Number(body.article_page_index);
    if (!Number.isInteger(pageIndex) || pageIndex < 1) {
      pageIndex = articlePageIndexForSlot(slotIds, slotId);
    }
    if (pageIndex < 1) {
      return NextResponse.json({ message: "Could not resolve article page index" }, { status: 400 });
    }

    let buffer;
    try {
      buffer = parsePngBase64(body.image_png_base64);
    } catch {
      return NextResponse.json({ message: "Invalid image data" }, { status: 400 });
    }
    if (!buffer?.length) {
      return NextResponse.json({ message: "Empty image" }, { status: 400 });
    }

    const publication = await PublicationModel.findByPk(publicationId);
    if (!publication) {
      return NextResponse.json({ message: "Publication not found" }, { status: 404 });
    }

    let uploadResult;
    try {
      uploadResult = await upsertArticlePageScreenshot(
        publication,
        networkArticleId,
        pageIndex,
        buffer
      );
    } catch (err) {
      console.error("[article-flatplan-composite]", err?.message ?? err);
      return NextResponse.json(
        { message: err?.message ?? "Failed to save screenshot" },
        { status: 500 }
      );
    }

    const imageUrl = uploadResult.cdnUrl || "";
    try {
      await slot.update({ slot_flatplan_image_url: imageUrl || null });
    } catch (err) {
      const msg = String(err?.message ?? "");
      if (!msg.includes("slot_flatplan_image_url")) throw err;
      console.warn(
        "[article-flatplan-composite] column slot_flatplan_image_url missing; run migration 051"
      );
    }

    return NextResponse.json({
      publication_slot_id: slotId,
      publication_article_id: publicationArticleId,
      article_page_index: pageIndex,
      screenshot_content_name: uploadResult.contentName,
      slot_flatplan_image_url: imageUrl,
      image_url: imageUrl,
      mediateca_folder_path: uploadResult.folderPath,
      media_id: uploadResult.mediaId,
    });
  },
  postSchema,
  true
);
