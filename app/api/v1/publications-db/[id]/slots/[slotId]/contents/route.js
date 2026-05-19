/**
 * Slot contents endpoint (slot-native after migration 045).
 *
 * GET    → synthetic view of slot advert/article fields for this slot.
 * PUT    → upsert advert (`slot_media_url`) or article (`slot_article_id`) on the slot.
 * DELETE → clear advert media or article assignment on the slot.
 */

import { createEndpoint } from "../../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationSlotDbModel,
  PublicationModel,
  ArticleModel,
  PublicationArticleDbModel,
  PublicationArticleChunkDbModel,
} from "../../../../../../../../server/database/models.js";
import {
  ensureMagazineSlotTitleSubtitleChunks,
  ensureSlotInPublicationArticleSpread,
  isFirstSlotInPublicationArticleSlotsArray,
} from "../../../../../../../../server/features/publication_workflow/PublicationArticleService.js";
import { normalizeMagazinePageLayout } from "../../../../../../../../server/features/publication_workflow/magazinePageLayout.js";
import {
  ensureAdvertSlotMaterialsFolderHierarchy,
  ensureArticleSlotMaterialsFolderHierarchy,
} from "../../../../../../../../server/features/publication/PublicationMediatecaFolderService.js";
import "../../../../../../../../server/database/models.js";

export const runtime = "nodejs";

const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;
const REGULAR_SLOT_POSITION = 0;
const DEFAULT_FORMAT = "advert";

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function advertObjectsFromMediaUrl(imageUrl) {
  const url = String(imageUrl ?? "").trim();
  if (!url) return [];
  return [
    {
      position: 1,
      publication_article_chunk_id: null,
      advert_media_src: url,
      url,
    },
  ];
}

function toApiSlotContentFromSlot(slot) {
  const s = toPlain(slot);
  if (!s) return null;
  const sid = Number(s.publication_slot_id);
  const format = String(s.slot_content_type ?? "").trim().toLowerCase() || DEFAULT_FORMAT;
  const mediaUrl = s.slot_media_url != null ? String(s.slot_media_url).trim() : "";
  const articleId = s.slot_article_id != null ? String(s.slot_article_id).trim() : "";
  const isAdvert = format === "advert" || (!articleId && mediaUrl);
  const isArticle = format === "article" || Boolean(articleId);

  if (!isAdvert && !isArticle) {
    return null;
  }

  return {
    publication_slot_content_id: sid,
    publication_slot_id: sid,
    publication_id: s.publication_id,
    publication_slot_position:
      String(s.slot_key) === COVER_SLOT_KEY ? COVER_SLOT_POSITION : REGULAR_SLOT_POSITION,
    slot_content_format: isArticle ? "article" : "advert",
    slot_content_object_array: isAdvert ? advertObjectsFromMediaUrl(mediaUrl) : [],
    article_id: isArticle ? articleId || null : null,
    magazine_page_layout: normalizeMagazinePageLayout(s.magazine_page_layout),
    slot_media_url: mediaUrl || null,
  };
}

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const publicationId = params?.id;
    const slotId = params?.slotId;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });

    if (!PublicationSlotDbModel?.sequelize) return NextResponse.json([]);

    const slot = await PublicationSlotDbModel.findOne({
      where: {
        publication_id: String(publicationId),
        publication_slot_id: Number(slotId),
      },
    });
    if (!slot) return NextResponse.json([]);

    try {
      const publication = await PublicationModel.findByPk(String(publicationId));
      if (publication) {
        const slotType = String(slot.get("slot_content_type") ?? "").trim().toLowerCase();
        const articleId = slot.get("slot_article_id");
        if (slotType === "article" && articleId) {
          await ensureArticleSlotMaterialsFolderHierarchy(
            publication,
            String(articleId),
            Number(slotId)
          );
        } else {
          await ensureAdvertSlotMaterialsFolderHierarchy(publication, Number(slotId));
        }
      }
    } catch (folderErr) {
      console.warn(
        "[publications-db/slots/contents GET] mediateca folder ensure failed:",
        folderErr?.message ?? folderErr
      );
    }

    const entry = toApiSlotContentFromSlot(slot);
    if (!entry) return NextResponse.json([]);

    if (entry.slot_content_format === "article" && entry.article_id) {
      try {
        const pa = await PublicationArticleDbModel.findOne({
          where: {
            publication_id: String(publicationId),
            article_id: String(entry.article_id),
          },
        });
        if (pa) {
          const paIdStr = String(pa.get("publication_article_id"));
          const slotIdNum = Number(slotId);
          await ensureSlotInPublicationArticleSpread(paIdStr, slotIdNum);
          await pa.reload();
          const chunkCount = await PublicationArticleChunkDbModel.count({
            where: { publication_slot_id: slotIdNum },
          });
          const arr = pa.get("publication_slots_id_array");
          const includeTs = isFirstSlotInPublicationArticleSlotsArray(arr, slotIdNum);
          if (chunkCount === 0) {
            await ensureMagazineSlotTitleSubtitleChunks(paIdStr, slotIdNum, {
              includeTitleSubtitle: includeTs,
            });
          }
        }
      } catch (hydrateErr) {
        console.warn(
          "[publications-db/slots/contents GET] article slot hydrate failed:",
          hydrateErr?.message ?? hydrateErr
        );
      }
    }

    return NextResponse.json([entry]);
  },
  null,
  true
);

const putSchema = Joi.object({
  image_url: Joi.string().trim().min(1).optional(),
  article_id: Joi.string().trim().min(1).optional(),
  slot_content_format: Joi.string().trim().min(1).optional(),
  publication_slot_position: Joi.number().integer().optional(),
}).or("image_url", "article_id");

export const PUT = createEndpoint(
  async (_request, body, params) => {
    const publicationId = params?.id;
    const slotId = params?.slotId;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    if (!PublicationSlotDbModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const slot = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!slot) return NextResponse.json({ message: "Slot not found" }, { status: 404 });
    if (String(slot.get("publication_id") ?? "") !== String(publicationId)) {
      return NextResponse.json(
        { message: "Slot does not belong to this publication" },
        { status: 400 }
      );
    }

    const imageUrl = body.image_url ? String(body.image_url).trim() : "";
    const articleId = body.article_id ? String(body.article_id).trim() : "";
    const format = body.slot_content_format
      ? String(body.slot_content_format).trim()
      : articleId
        ? "article"
        : DEFAULT_FORMAT;

    if (articleId) {
      const article = await ArticleModel.findByPk(articleId);
      if (!article) {
        return NextResponse.json(
          { message: `Article ${articleId} not found` },
          { status: 400 }
        );
      }
    }

    const sequelize = PublicationSlotDbModel.sequelize;
    const result = await sequelize.transaction(async (transaction) => {
      const publication = await PublicationModel.findByPk(String(publicationId), { transaction });

      const slotUpdates = {
        slot_content_type: format,
      };
      if (articleId) {
        slotUpdates.slot_article_id = articleId;
        slotUpdates.slot_media_url = null;
      } else if (imageUrl) {
        slotUpdates.slot_media_url = imageUrl;
        slotUpdates.slot_article_id = null;
      }

      await slot.update(slotUpdates, { transaction });

      if (String(slot.get("slot_key")) === COVER_SLOT_KEY && publication && imageUrl) {
        await publication.update({ publication_main_image_url: imageUrl }, { transaction });
      }

      if (publication) {
        if (articleId) {
          await ensureArticleSlotMaterialsFolderHierarchy(
            publication,
            articleId,
            Number(slotId),
            { transaction }
          );
        } else if (imageUrl) {
          await ensureAdvertSlotMaterialsFolderHierarchy(publication, Number(slotId), {
            transaction,
          });
        }
      }

      return slot;
    });

    await result.reload();
    let out = toApiSlotContentFromSlot(result);
    if (out && out.slot_content_format === "article" && out.article_id) {
      try {
        const pa = await PublicationArticleDbModel.findOne({
          where: {
            publication_id: String(publicationId),
            article_id: String(out.article_id),
          },
        });
        if (pa) {
          const paIdStr = String(pa.get("publication_article_id"));
          await ensureSlotInPublicationArticleSpread(paIdStr, Number(slotId));
          await pa.reload();
          const arr = pa.get("publication_slots_id_array");
          const includeTs = isFirstSlotInPublicationArticleSlotsArray(arr, Number(slotId));
          await ensureMagazineSlotTitleSubtitleChunks(paIdStr, Number(slotId), {
            includeTitleSubtitle: includeTs,
          });
          const refreshed = await PublicationSlotDbModel.findByPk(Number(slotId));
          if (refreshed) out = toApiSlotContentFromSlot(refreshed) ?? out;
        }
      } catch (e) {
        console.warn("[publications-db/slots/contents PUT] article hydrate:", e?.message ?? e);
      }
    }

    return NextResponse.json(out);
  },
  putSchema,
  true
);

export const DELETE = createEndpoint(
  async (request, _body, params) => {
    const publicationId = params?.id;
    const slotId = params?.slotId;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    if (!PublicationSlotDbModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const slot = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!slot) return NextResponse.json({ message: "Slot not found" }, { status: 404 });
    if (String(slot.get("publication_id") ?? "") !== String(publicationId)) {
      return NextResponse.json(
        { message: "Slot does not belong to this publication" },
        { status: 400 }
      );
    }

    const sequelize = PublicationSlotDbModel.sequelize;
    await sequelize.transaction(async (transaction) => {
      const ctype = String(slot.get("slot_content_type") ?? "").trim().toLowerCase();
      if (ctype === "article") {
        await slot.update({ slot_article_id: null }, { transaction });
      } else {
        await slot.update({ slot_media_url: null }, { transaction });
      }
      if (String(slot.get("slot_key")) === COVER_SLOT_KEY) {
        const publication = await PublicationModel.findByPk(String(publicationId), { transaction });
        if (publication) {
          await publication.update({ publication_main_image_url: "" }, { transaction });
        }
      }
    });

    return NextResponse.json({ deleted: true });
  },
  null,
  true
);
