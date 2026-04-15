import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationSlotDbModel } from "../../../../../../server/database/models.js";
import "../../../../../../server/database/models.js";

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

function slotSortKey(slotKey) {
  const k = String(slotKey || "").toLowerCase();
  if (k === "cover") return { group: 0, n: 0, raw: k };
  if (k === "inside_cover") return { group: 1, n: 0, raw: k };
  if (k === "end") return { group: 3, n: 0, raw: k };
  const n = Number(k);
  if (Number.isFinite(n)) return { group: 2, n, raw: k };
  return { group: 2, n: 9999, raw: k };
}

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const publicationId = params?.id;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });

    if (!PublicationSlotDbModel?.sequelize) return NextResponse.json([]);

    const rows = await PublicationSlotDbModel.findAll({
      where: { publication_id: String(publicationId) },
    });

    const list = rows.map(toApiSlot).filter(Boolean);
    list.sort((a, b) => {
      const ka = slotSortKey(a.slot_key);
      const kb = slotSortKey(b.slot_key);
      if (ka.group !== kb.group) return ka.group - kb.group;
      if (ka.n !== kb.n) return ka.n - kb.n;
      return ka.raw.localeCompare(kb.raw);
    });

    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  slot_key: Joi.string().trim().min(1).required(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  slot_content_type: Joi.string().allow("").optional(),
  slot_state: Joi.string().allow("").optional(),
  customer_id: Joi.string().allow(null, "").optional(),
  project_id: Joi.string().allow(null, "").optional(),
  slot_media_url: Joi.string().allow(null, "").optional(),
  slot_article_id: Joi.string().allow(null, "").optional(),
});

export const POST = createEndpoint(
  async (_request, body, params) => {
    const publicationId = params?.id;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!PublicationSlotDbModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const slotKey = String(body.slot_key).trim();

    // Avoid duplicates: (publication_id, slot_key) should be unique at app level
    const existing = await PublicationSlotDbModel.findOne({
      where: { publication_id: String(publicationId), slot_key: slotKey },
    });
    if (existing) return NextResponse.json(toApiSlot(existing));

    const row = await PublicationSlotDbModel.create({
      publication_id: String(publicationId),
      publication_format: body.publication_format ?? "flipbook",
      slot_key: slotKey,
      slot_content_type: body.slot_content_type ?? "",
      slot_state: body.slot_state ?? "pending",
      customer_id: body.customer_id ? String(body.customer_id) : null,
      project_id: body.project_id ? String(body.project_id) : null,
      slot_media_url: body.slot_media_url ? String(body.slot_media_url) : null,
      slot_article_id: body.slot_article_id ? String(body.slot_article_id) : null,
    });

    return NextResponse.json(toApiSlot(row));
  },
  postSchema,
  true
);

