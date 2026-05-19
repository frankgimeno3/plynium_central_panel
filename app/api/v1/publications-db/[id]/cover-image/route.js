/**
 * Publication "Cover Page" image endpoint.
 *
 * Persists the cover image on the cover slot's `slot_media_url` and mirrors it to
 * `publications_db.publication_main_image_url` for existing thumbnail UI.
 */

import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationModel, PublicationSlotDbModel } from "../../../../../../server/database/models.js";
import "../../../../../../server/database/models.js";

export const runtime = "nodejs";

const COVER_SLOT_KEY = "cover";
const COVER_SLOT_POSITION = -1;
const COVER_SLOT_CONTENT_FORMAT = "advert";

const putSchema = Joi.object({
  image_url: Joi.string().trim().min(1).required(),
});

function toApi(publication, slot) {
  const p = publication?.get ? publication.get({ plain: true }) : publication;
  const s = slot?.get ? slot.get({ plain: true }) : slot;
  const url =
    (s?.slot_media_url && String(s.slot_media_url).trim()) ||
    (p?.publication_main_image_url && String(p.publication_main_image_url).trim()) ||
    "";
  const objects = url
    ? [
        {
          position: 1,
          publication_article_chunk_id: null,
          advert_media_src: url,
          url,
        },
      ]
    : [];
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

    return NextResponse.json(toApi(publication, slot));
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
            publication_page: -1,
            slot_ordinal: 0,
            slot_content_type: "advert",
            slot_state: "pending",
          },
          { transaction }
        );
      }

      await slot.update(
        {
          slot_content_type: "advert",
          slot_media_url: imageUrl,
          slot_article_id: null,
        },
        { transaction }
      );

      await publication.update({ publication_main_image_url: imageUrl }, { transaction });

      return slot;
    });

    await result.reload();
    return NextResponse.json(toApi(publication, result));
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
        await slot.update({ slot_media_url: null }, { transaction });
      }
      await publication.update({ publication_main_image_url: "" }, { transaction });
    });

    return NextResponse.json({ deleted: true });
  },
  null,
  true
);
