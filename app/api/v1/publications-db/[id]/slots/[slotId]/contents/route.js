/**
 * Slot contents endpoint.
 *
 * GET    → list every `publication_slot_content` row for the slot.
 * PUT    → upsert a single advert/preview entry for the slot:
 *            - `slot_content_format` defaults to "advert".
 *            - `publication_slot_position` defaults to -1 for the cover slot
 *              (per spec) and 0 for any other slot, so a regular advert page
 *              has at most one canonical content row.
 *            - advert rows use the new shape
 *              `slot_content_object_array = [{ position: 1, publication_article_chunk_id: null,
 *                                               advert_media_src: <image_url>, url: <image_url> }]`.
 *              The legacy `url` key is kept alongside `advert_media_src` so older
 *              consumers (cover thumbnail, etc.) keep reading the same field.
 *            - article rows use `article_id` and mirror it to publication_slots_db.slot_article_id.
 *          The publication_main_image_url mirror is updated only for the cover
 *          slot, so the existing thumbnail UI keeps working.
 * DELETE → remove that same canonical entry. Mirrors the cover slot URL clear
 *          back to publications_db when applicable.
 */

import { createEndpoint } from "../../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationSlotDbModel,
  PublicationSlotContentDbModel,
  PublicationModel,
  ArticleModel,
} from "../../../../../../../../server/database/models.js";
import "../../../../../../../../server/database/models.js";

export const runtime = "nodejs";

const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;
const REGULAR_SLOT_POSITION = 0;
const DEFAULT_FORMAT = "advert";
const SLOT_CONTENT_ATTRIBUTES = [
  "publication_slot_content_id",
  "publication_id",
  "publication_slot_id",
  "publication_slot_position",
  "slot_content_format",
  "slot_content_object_array",
  "article_id",
];
const SLOT_CONTENT_ATTRIBUTES_WITHOUT_ARTICLE = SLOT_CONTENT_ATTRIBUTES.filter(
  (attr) => attr !== "article_id"
);

function isMissingArticleIdColumn(error) {
  const msg = `${error?.message ?? ""} ${error?.original?.message ?? ""}`;
  return msg.includes("article_id") && msg.includes("does not exist");
}

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiSlotContent(row) {
  const c = toPlain(row);
  if (!c) return null;
  return {
    publication_slot_content_id: c.publication_slot_content_id,
    publication_id: c.publication_id,
    publication_slot_id: c.publication_slot_id,
    publication_slot_position: c.publication_slot_position ?? 0,
    slot_content_format: c.slot_content_format ?? "",
    slot_content_object_array: c.slot_content_object_array ?? [],
    article_id: c.article_id ?? null,
  };
}

function defaultPositionForSlot(slot) {
  if (!slot) return REGULAR_SLOT_POSITION;
  return String(slot.get("slot_key")) === COVER_SLOT_KEY
    ? COVER_SLOT_POSITION
    : REGULAR_SLOT_POSITION;
}

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const publicationId = params?.id;
    const slotId = params?.slotId;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });

    if (!PublicationSlotContentDbModel?.sequelize) return NextResponse.json([]);

    let rows;
    try {
      rows = await PublicationSlotContentDbModel.findAll({
        attributes: SLOT_CONTENT_ATTRIBUTES,
        where: {
          publication_id: String(publicationId),
          publication_slot_id: Number(slotId),
        },
        order: [["publication_slot_position", "ASC"]],
      });
    } catch (error) {
      if (!isMissingArticleIdColumn(error)) throw error;
      rows = await PublicationSlotContentDbModel.findAll({
        attributes: SLOT_CONTENT_ATTRIBUTES_WITHOUT_ARTICLE,
        where: {
          publication_id: String(publicationId),
          publication_slot_id: Number(slotId),
        },
        order: [["publication_slot_position", "ASC"]],
      });
    }

    return NextResponse.json(rows.map(toApiSlotContent).filter(Boolean));
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
    const position =
      body.publication_slot_position != null
        ? Number(body.publication_slot_position)
        : defaultPositionForSlot(slot);

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
      // New canonical shape requested by the Contents Manager:
      //   [{ position, publication_article_chunk_id, advert_media_src }]
      // For adverts there is a single position-1 entry whose
      // `advert_media_src` carries the image URL. We also keep the legacy
      // `url` key so older consumers that still read it (e.g. cover
      // thumbnail in the Data tab) keep working without an extra migration.
      const objects = imageUrl
        ? [
            {
              position: 1,
              publication_article_chunk_id: null,
              advert_media_src: imageUrl,
              url: imageUrl,
            },
          ]
        : [];
      const existing = await PublicationSlotContentDbModel.findOne({
        attributes: articleId ? SLOT_CONTENT_ATTRIBUTES : SLOT_CONTENT_ATTRIBUTES_WITHOUT_ARTICLE,
        where: {
          publication_id: String(publicationId),
          publication_slot_id: Number(slotId),
          publication_slot_position: position,
        },
        transaction,
      });

      let row;
      const contentPayload = {
        slot_content_format: format,
        slot_content_object_array: objects,
      };
      if (articleId) {
        contentPayload.article_id = articleId;
      }
      if (existing) {
        await existing.update(contentPayload, { transaction });
        row = existing;
      } else {
        row = await PublicationSlotContentDbModel.create(
          {
            publication_id: String(publicationId),
            publication_slot_id: Number(slotId),
            publication_slot_position: position,
            ...contentPayload,
          },
          { transaction }
        );
      }

      // Cover slot: keep publications_db.publication_main_image_url in sync
      // so the existing thumbnail UI on the issues list keeps working without
      // an extra join.
      if (String(slot.get("slot_key")) === COVER_SLOT_KEY) {
        const publication = await PublicationModel.findByPk(String(publicationId), { transaction });
        if (publication) {
          await publication.update(
            { publication_main_image_url: imageUrl },
            { transaction }
          );
        }
      }

      if (articleId) {
        await slot.update({ slot_article_id: articleId }, { transaction });
      }

      return row;
    });

    return NextResponse.json(toApiSlotContent(result));
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

    const url = new URL(request.url);
    const positionParam = url.searchParams.get("publication_slot_position");
    const position =
      positionParam != null && positionParam !== ""
        ? Number(positionParam)
        : defaultPositionForSlot(slot);

    const sequelize = PublicationSlotDbModel.sequelize;
    await sequelize.transaction(async (transaction) => {
      await PublicationSlotContentDbModel.destroy({
        where: {
          publication_id: String(publicationId),
          publication_slot_id: Number(slotId),
          publication_slot_position: position,
        },
        transaction,
      });
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
