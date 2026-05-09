/**
 * Publication "Cover Page" image endpoint.
 *
 * Persists the chosen cover image in two places so existing UI keeps working:
 *   1. `publication_slot_content` row keyed by the publication's `slot_key='cover'`
 *      slot, with `slot_content_format='advert'` and `publication_slot_position=-1`
 *      (per the spec: this is what canonically represents the cover asset).
 *   2. `publications_db.publication_main_image_url` so existing read paths
 *      and thumbnail listings keep showing the same image without a join.
 *
 * The cover slot is auto-created on first use to handle legacy publications
 * that never opened the Flatplan tab.
 */

import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  PublicationModel,
  PublicationSlotDbModel,
  PublicationSlotContentDbModel,
} from "../../../../../../server/database/models.js";
import "../../../../../../server/database/models.js";

export const runtime = "nodejs";

const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;
const COVER_SLOT_CONTENT_FORMAT = "advert";
const SLOT_CONTENT_ATTRIBUTES_WITHOUT_ARTICLE = [
  "publication_slot_content_id",
  "publication_id",
  "publication_slot_id",
  "publication_slot_position",
  "slot_content_format",
  "slot_content_object_array",
];

const putSchema = Joi.object({
  image_url: Joi.string().trim().min(1).required(),
});

function toApi(publication, slot, content) {
  const p = publication?.get ? publication.get({ plain: true }) : publication;
  const s = slot?.get ? slot.get({ plain: true }) : slot;
  const c = content?.get ? content.get({ plain: true }) : content;
  const objects = Array.isArray(c?.slot_content_object_array)
    ? c.slot_content_object_array
    : [];
  const url =
    objects.length > 0 && objects[0] && typeof objects[0].url === "string"
      ? objects[0].url
      : (p?.publication_main_image_url || "");
  return {
    publication_id: p?.publication_id ?? null,
    publication_slot_id: s?.publication_slot_id ?? null,
    publication_slot_position: COVER_SLOT_POSITION,
    slot_content_format: COVER_SLOT_CONTENT_FORMAT,
    slot_content_object_array: objects,
    image_url: url,
    publication_main_image_url: p?.publication_main_image_url ?? "",
  };
}

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!PublicationModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const publication = await PublicationModel.findByPk(String(id));
    if (!publication) return NextResponse.json({ message: "Publication not found" }, { status: 404 });

    const slot = await PublicationSlotDbModel.findOne({
      where: { publication_id: String(id), slot_key: COVER_SLOT_KEY },
    });
    const content = slot
      ? await PublicationSlotContentDbModel.findOne({
          attributes: SLOT_CONTENT_ATTRIBUTES_WITHOUT_ARTICLE,
          where: {
            publication_id: String(id),
            publication_slot_id: slot.get("publication_slot_id"),
            publication_slot_position: COVER_SLOT_POSITION,
          },
        })
      : null;

    return NextResponse.json(toApi(publication, slot, content));
  },
  null,
  true
);

export const PUT = createEndpoint(
  async (_request, body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!PublicationModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const publication = await PublicationModel.findByPk(String(id));
    if (!publication) return NextResponse.json({ message: "Publication not found" }, { status: 404 });

    const imageUrl = String(body.image_url).trim();
    const sequelize = PublicationModel.sequelize;

    const result = await sequelize.transaction(async (transaction) => {
      let slot = await PublicationSlotDbModel.findOne({
        where: { publication_id: String(id), slot_key: COVER_SLOT_KEY },
        transaction,
      });
      if (!slot) {
        slot = await PublicationSlotDbModel.create(
          {
            publication_id: String(id),
            publication_format: "flipbook",
            slot_key: COVER_SLOT_KEY,
            slot_content_type: "advert",
            slot_state: "pending",
          },
          { transaction }
        );
      }

      const slotId = slot.get("publication_slot_id");
      const objects = [{ url: imageUrl }];

      const existingContent = await PublicationSlotContentDbModel.findOne({
        attributes: SLOT_CONTENT_ATTRIBUTES_WITHOUT_ARTICLE,
        where: {
          publication_id: String(id),
          publication_slot_id: slotId,
          publication_slot_position: COVER_SLOT_POSITION,
        },
        transaction,
      });
      let content;
      if (existingContent) {
        await existingContent.update(
          {
            slot_content_format: COVER_SLOT_CONTENT_FORMAT,
            slot_content_object_array: objects,
          },
          { transaction }
        );
        content = existingContent;
      } else {
        content = await PublicationSlotContentDbModel.create(
          {
            publication_id: String(id),
            publication_slot_id: slotId,
            publication_slot_position: COVER_SLOT_POSITION,
            slot_content_format: COVER_SLOT_CONTENT_FORMAT,
            slot_content_object_array: objects,
          },
          { transaction }
        );
      }

      await publication.update({ publication_main_image_url: imageUrl }, { transaction });

      return { slot, content };
    });

    return NextResponse.json(toApi(publication, result.slot, result.content));
  },
  putSchema,
  true
);

export const DELETE = createEndpoint(
  async (_request, _body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!PublicationModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const publication = await PublicationModel.findByPk(String(id));
    if (!publication) return NextResponse.json({ message: "Publication not found" }, { status: 404 });

    const sequelize = PublicationModel.sequelize;
    await sequelize.transaction(async (transaction) => {
      const slot = await PublicationSlotDbModel.findOne({
        where: { publication_id: String(id), slot_key: COVER_SLOT_KEY },
        transaction,
      });
      if (slot) {
        const slotId = slot.get("publication_slot_id");
        await PublicationSlotContentDbModel.destroy({
          where: {
            publication_id: String(id),
            publication_slot_id: slotId,
            publication_slot_position: COVER_SLOT_POSITION,
          },
          transaction,
        });
      }
      await publication.update({ publication_main_image_url: "" }, { transaction });
    });

    return NextResponse.json({ deleted: true });
  },
  null,
  true
);
