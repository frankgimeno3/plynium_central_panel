import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationSlotDbModel } from "../../../../../server/database/models.js";
import "../../../../../server/database/models.js";

export const runtime = "nodejs";

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiSlot(row) {
  const s = toPlain(row);
  if (!s) return null;
  return {
    publication_slot_id: s.publication_slot_id,
    publication_id: s.publication_id ?? null,
    publication_format: s.publication_format ?? "flipbook",
    slot_key: s.slot_key ?? "",
    slot_content_type: s.slot_content_type ?? "",
    slot_state: s.slot_state ?? "",
    customer_id: s.customer_id ?? null,
    project_id: s.project_id ?? null,
    slot_media_url: s.slot_media_url ?? null,
    slot_article_id: s.slot_article_id ?? null,
    slot_created_at: s.slot_created_at ?? null,
    slot_updated_at: s.slot_updated_at ?? null,
  };
}

const patchSchema = Joi.object({
  publication_id: Joi.string().allow(null, "").optional(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  slot_key: Joi.string().min(1).optional(),
  slot_content_type: Joi.string().min(1).optional(),
  slot_state: Joi.string().min(1).optional(),
  customer_id: Joi.string().allow(null, "").optional(),
  project_id: Joi.string().allow(null, "").optional(),
  slot_media_url: Joi.string().allow(null, "").optional(),
  slot_article_id: Joi.string().allow(null, "").optional(),
});

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const slotId = params?.slotId;
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    const row = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!row) return NextResponse.json({ message: "Slot not found" }, { status: 404 });
    return NextResponse.json(toApiSlot(row));
  },
  null,
  true
);

export const PATCH = createEndpoint(
  async (_request, body, params) => {
    const slotId = params?.slotId;
    if (!slotId) return NextResponse.json({ message: "Missing slot id" }, { status: 400 });
    const row = await PublicationSlotDbModel.findByPk(Number(slotId));
    if (!row) return NextResponse.json({ message: "Slot not found" }, { status: 404 });

    const updates = {};
    if (body.publication_id !== undefined) updates.publication_id = body.publication_id || null;
    if (body.publication_format !== undefined) updates.publication_format = String(body.publication_format);
    if (body.slot_key !== undefined) updates.slot_key = String(body.slot_key);
    if (body.slot_content_type !== undefined) updates.slot_content_type = String(body.slot_content_type);
    if (body.slot_state !== undefined) updates.slot_state = String(body.slot_state);
    if (body.customer_id !== undefined) updates.customer_id = body.customer_id || null;
    if (body.project_id !== undefined) updates.project_id = body.project_id || null;
    if (body.slot_media_url !== undefined) updates.slot_media_url = body.slot_media_url || null;
    if (body.slot_article_id !== undefined) updates.slot_article_id = body.slot_article_id || null;

    await row.update(updates);
    return NextResponse.json(toApiSlot(row));
  },
  patchSchema,
  true
);

