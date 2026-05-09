import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { Op } from "sequelize";
import {
  PublicationSlotDbModel,
  ProjectDbModel,
  CustomerDbModel,
} from "../../../../../../server/database/models.js";
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
    customer_name: null,
    project_contract_id: null,
  };
}

async function enrichSlotsWithProjectAndCustomer(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return;

  const projectIds = [
    ...new Set(
      slots
        .map((s) => (s.project_id != null ? String(s.project_id).trim() : ""))
        .filter((v) => v !== "")
    ),
  ];
  const customerIds = [
    ...new Set(
      slots
        .map((s) => (s.customer_id != null ? String(s.customer_id).trim() : ""))
        .filter((v) => v !== "")
    ),
  ];

  const projectContractById = new Map();
  if (projectIds.length && ProjectDbModel?.sequelize) {
    const projects = await ProjectDbModel.findAll({
      where: { id_project: { [Op.in]: projectIds } },
      attributes: ["id_project", "id_contract"],
    });
    for (const p of projects) {
      const pl = p.get({ plain: true });
      const id = pl.id_project != null ? String(pl.id_project).trim() : "";
      if (id) projectContractById.set(id, pl.id_contract != null ? String(pl.id_contract) : null);
    }
  }

  const customerNameById = new Map();
  if (customerIds.length && CustomerDbModel?.sequelize) {
    const customers = await CustomerDbModel.findAll({
      where: { id_customer: { [Op.in]: customerIds } },
      attributes: ["id_customer", "name"],
    });
    for (const c of customers) {
      const cl = c.get({ plain: true });
      const id = cl.id_customer != null ? String(cl.id_customer).trim() : "";
      if (id) customerNameById.set(id, cl.name != null ? String(cl.name) : null);
    }
  }

  for (const s of slots) {
    const pid = s.project_id != null ? String(s.project_id).trim() : "";
    const cid = s.customer_id != null ? String(s.customer_id).trim() : "";
    s.project_contract_id = pid ? projectContractById.get(pid) ?? null : null;
    s.customer_name = cid ? customerNameById.get(cid) ?? null : null;
  }
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
    await enrichSlotsWithProjectAndCustomer(list);
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

