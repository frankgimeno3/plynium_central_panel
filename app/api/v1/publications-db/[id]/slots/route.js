import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { Op } from "sequelize";
import {
  PublicationModel,
  PublicationSlotDbModel,
  PublicationArticleDbModel,
  PublicationArticleChunkDbModel,
  ProjectDbModel,
  CustomerDbModel,
} from "../../../../../../server/database/models.js";
import { normalizeMagazinePageLayout } from "../../../../../../server/features/publication_workflow/magazinePageLayout.js";
import "../../../../../../server/database/models.js";
import { computeNextRegularPublicationPage } from "../../../../../../server/features/publication/computeNextRegularPublicationPage.js";
import { shiftPublicationSlotsForRegularInsert } from "../../../../../../server/features/publication/shiftPublicationSlotsForRegularInsert.js";
import {
  triggerRegeneratePublicationIndexAndSummary,
} from "../../../../../../server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

const ALLOWED_SLOT_KEYS = new Set([
  "cover",
  "inside_cover",
  "end",
  "preferential_page",
  "regular_page",
]);

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toApiSlot(row) {
  const s = toPlain(row);
  if (!s) return null;
  const publication_page = numOrNull(s.publication_page);
  const slot_ordinal = numOrNull(s.slot_ordinal);
  return {
    publication_slot_id: s.publication_slot_id,
    publication_id: s.publication_id ?? null,
    publication_format: s.publication_format ?? "flipbook",
    slot_key: s.slot_key ?? "",
    publication_page,
    slot_ordinal,
    slot_content_type: s.slot_content_type ?? "",
    slot_state: s.slot_state ?? "",
    customer_id: s.customer_id ?? null,
    project_id: s.project_id ?? null,
    slot_media_url: s.slot_media_url ?? null,
    slot_flatplan_image_url: s.slot_flatplan_image_url ?? null,
    slot_article_id: s.slot_article_id ?? null,
    magazine_page_layout: normalizeMagazinePageLayout(s.magazine_page_layout),
    slot_created_at: s.slot_created_at ?? null,
    slot_updated_at: s.slot_updated_at ?? null,
    customer_name: null,
    project_contract_id: null,
    flatplan_publication_article_id: null,
    flatplan_article_page_index: null,
    flatplan_article_page_total: null,
    flatplan_article_chunks_in_slot: null,
    flatplan_publication_article_state: null,
    flatplan_preview_chunks: null,
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

/**
 * For flatplan preview: map each `regular_page` slot to its publication article spread
 * (page index / total) and count chunks tied to this slot via `publication_slot_id`.
 */
async function enrichSlotsWithFlatplanPublicationArticleMeta(slots, publicationId) {
  if (!Array.isArray(slots) || slots.length === 0) return;
  if (!PublicationArticleDbModel?.sequelize) return;

  const pid = String(publicationId);

  for (const s of slots) {
    s.flatplan_publication_article_id = null;
    s.flatplan_article_page_index = null;
    s.flatplan_article_page_total = null;
    s.flatplan_article_chunks_in_slot = null;
    s.flatplan_publication_article_state = null;
    s.flatplan_publication_art_name = null;
  }

  const articles = await PublicationArticleDbModel.findAll({
    where: { publication_id: pid },
    attributes: [
      "publication_article_id",
      "publication_slots_id_array",
      "desired_page_count",
      "publication_article_state",
      "publication_art_name",
    ],
  });

  /** @type {Map<number, { publication_article_id: string, pageIndex1: number, pageTotal: number, publication_article_state: string, publication_art_name: string | null }>} */
  const slotArticleMeta = new Map();

  for (const row of articles) {
    const pa = toPlain(row);
    if (!pa?.publication_article_id) continue;
    const paId = String(pa.publication_article_id);
    const stateRaw = pa.publication_article_state;
    const publication_article_state =
      stateRaw != null && String(stateRaw).trim() !== ""
        ? String(stateRaw).trim()
        : "unfinished";
    const publication_art_name =
      pa.publication_art_name != null && String(pa.publication_art_name).trim() !== ""
        ? String(pa.publication_art_name).trim()
        : null;
    const arr = Array.isArray(pa.publication_slots_id_array) ? pa.publication_slots_id_array : [];
    const desired = Math.max(1, Math.round(Number(pa.desired_page_count)) || 1);
    const pageTotal = Math.max(desired, arr.length, 1);
    for (let i = 0; i < arr.length; i++) {
      const sid = Number(arr[i]);
      if (!Number.isFinite(sid)) continue;
      if (slotArticleMeta.has(sid)) continue;
      slotArticleMeta.set(sid, {
        publication_article_id: paId,
        pageIndex1: i + 1,
        pageTotal,
        publication_article_state,
        publication_art_name,
      });
    }
  }

  if (slotArticleMeta.size === 0) return;

  const slotIds = [...slotArticleMeta.keys()];

  /** @type {Map<string, number>} key `${publication_article_id}:${publication_slot_id}` */
  const chunkCountByPair = new Map();
  if (slotIds.length > 0 && PublicationArticleChunkDbModel?.sequelize) {
    const chunkRows = await PublicationArticleChunkDbModel.findAll({
      where: {
        publication_id: pid,
        publication_slot_id: { [Op.in]: slotIds },
      },
      attributes: ["publication_article_id", "publication_slot_id"],
    });
    for (const ch of chunkRows) {
      const pl = toPlain(ch);
      const paid = pl.publication_article_id != null ? String(pl.publication_article_id) : "";
      const psid = Number(pl.publication_slot_id);
      if (!paid || !Number.isFinite(psid)) continue;
      const k = `${paid}:${psid}`;
      chunkCountByPair.set(k, (chunkCountByPair.get(k) ?? 0) + 1);
    }
  }

  for (const s of slots) {
    const sid = Number(s.publication_slot_id);
    const meta = slotArticleMeta.get(sid);
    if (!meta) continue;
    const chunks = chunkCountByPair.get(`${meta.publication_article_id}:${sid}`) ?? 0;
    s.flatplan_publication_article_id = meta.publication_article_id;
    s.flatplan_article_page_index = meta.pageIndex1;
    s.flatplan_article_page_total = meta.pageTotal;
    s.flatplan_article_chunks_in_slot = chunks;
    s.flatplan_publication_article_state = meta.publication_article_state;
    s.flatplan_publication_art_name = meta.publication_art_name;
  }
}

/**
 * Lightweight chunk payload for flatplan tile thumbnails (article slots only).
 */
async function enrichSlotsWithFlatplanArticleChunkPreviews(slots, publicationId) {
  if (!Array.isArray(slots) || slots.length === 0) return;
  if (!PublicationArticleChunkDbModel?.sequelize) return;

  const pid = String(publicationId);
  const articleSlotIds = slots
    .filter((s) => String(s.slot_content_type ?? "").trim().toLowerCase() === "article")
    .map((s) => Number(s.publication_slot_id))
    .filter((n) => Number.isFinite(n) && n > 0);

  for (const s of slots) {
    s.flatplan_preview_chunks = null;
  }

  if (articleSlotIds.length === 0) return;

  const chunkRows = await PublicationArticleChunkDbModel.findAll({
    where: {
      publication_id: pid,
      publication_slot_id: { [Op.in]: articleSlotIds },
    },
    attributes: [
      "publication_slot_id",
      "publication_article_chunk_id",
      "publication_article_chunk_format",
      "chunk_html",
      "chunk_position",
    ],
    order: [
      ["publication_slot_id", "ASC"],
      ["chunk_position", "ASC"],
    ],
  });

  /** @type {Map<number, object[]>} */
  const bySlotId = new Map();
  for (const row of chunkRows) {
    const pl = toPlain(row);
    const sid = Number(pl.publication_slot_id);
    if (!Number.isFinite(sid) || sid <= 0) continue;
    const list = bySlotId.get(sid) ?? [];
    list.push({
      publication_article_chunk_id: String(pl.publication_article_chunk_id ?? ""),
      publication_article_chunk_format: String(pl.publication_article_chunk_format ?? ""),
      chunk_html: String(pl.chunk_html ?? ""),
      chunk_position: Number(pl.chunk_position) || 0,
    });
    bySlotId.set(sid, list);
  }

  for (const s of slots) {
    const sid = Number(s.publication_slot_id);
    const chunks = bySlotId.get(sid);
    if (chunks && chunks.length > 0) {
      s.flatplan_preview_chunks = chunks;
    }
  }
}

/**
 * Broadcast the publication-level auto-generated PDFs (advert index + article
 * summary) onto every slot whose `slot_content_type` matches, so the flatplan
 * tile can render the PDF preview the same way it does for advert media.
 */
async function enrichSummaryAndIndexSlotsWithPdf(list, publicationId) {
  if (!list?.length || !PublicationModel?.sequelize) return;
  let indexUrl = "";
  let summaryUrl = "";
  try {
    const pub = await PublicationModel.findByPk(String(publicationId), {
      attributes: ["publication_index_pdf_url", "publication_summary_pdf_url"],
    });
    indexUrl = String(pub?.get?.("publication_index_pdf_url") ?? "").trim();
    summaryUrl = String(pub?.get?.("publication_summary_pdf_url") ?? "").trim();
  } catch (err) {
    const msg = String(err?.message ?? "");
    if (
      !msg.includes("publication_index_pdf_url") &&
      !msg.includes("publication_summary_pdf_url")
    )
      throw err;
    return;
  }
  const hasIndexSlot = list.some(
    (s) => String(s.slot_content_type ?? "").trim().toLowerCase() === "index"
  );
  const hasSummarySlot = list.some(
    (s) => String(s.slot_content_type ?? "").trim().toLowerCase() === "summary"
  );
  if ((hasIndexSlot && !indexUrl) || (hasSummarySlot && !summaryUrl)) {
    // First load after the feature ships: kick off regeneration so the next
    // refresh shows the PDFs without requiring an explicit admin action.
    triggerRegeneratePublicationIndexAndSummary(String(publicationId));
  }
  if (!indexUrl && !summaryUrl) return;
  for (const s of list) {
    const t = String(s.slot_content_type ?? "").trim().toLowerCase();
    if (t === "index" && indexUrl) s.flatplan_index_pdf_url = indexUrl;
    if (t === "summary" && summaryUrl) s.flatplan_summary_pdf_url = summaryUrl;
  }
}

/** Attach full cover composite URL to the cover slot for flatplan preview. */
async function enrichCoverSlotWithFlatplanComposite(list, publicationId) {
  if (!list?.length || !PublicationModel?.sequelize) return;
  let url = "";
  try {
    const pub = await PublicationModel.findByPk(String(publicationId), {
      attributes: ["publication_cover_flatplan_image_url"],
    });
    url = String(pub?.get?.("publication_cover_flatplan_image_url") ?? "").trim();
  } catch (err) {
    const msg = String(err?.message ?? "");
    if (!msg.includes("publication_cover_flatplan_image_url")) throw err;
    return;
  }
  if (!url) return;
  for (const s of list) {
    if (String(s.slot_key ?? "").trim().toLowerCase() === "cover") {
      s.flatplan_cover_composite_url = url;
    }
  }
}

/** Fallback ordering when `slot_ordinal` ties (should be rare). */
function slotSortKey(slotKey, publicationPage) {
  const k = String(slotKey || "").toLowerCase();
  const pp = numOrNull(publicationPage);
  if (k === "cover") return { group: 0, n: -1, raw: k };
  if (k === "inside_cover") return { group: 1, n: 0, raw: k };
  if (k === "preferential_page" && pp != null) return { group: 2, n: pp, raw: k };
  if (k === "regular_page") return { group: 3, n: pp ?? 9999, raw: k };
  if (k === "end") return { group: 4, n: pp ?? 10, raw: k };
  return { group: 9, n: pp ?? 9999, raw: k };
}

function compareSlotsPublicationOrder(a, b) {
  const ao = a.slot_ordinal;
  const bo = b.slot_ordinal;
  const aHas = ao != null && Number.isFinite(Number(ao));
  const bHas = bo != null && Number.isFinite(Number(bo));
  if (aHas && bHas && Number(ao) !== Number(bo)) {
    return Number(ao) - Number(bo);
  }
  const ap = a.publication_page;
  const bp = b.publication_page;
  const apHas = ap != null && Number.isFinite(Number(ap));
  const bpHas = bp != null && Number.isFinite(Number(bp));
  if (apHas && bpHas && Number(ap) !== Number(bp)) {
    return Number(ap) - Number(bp);
  }
  const ka = slotSortKey(a.slot_key, ap);
  const kb = slotSortKey(b.slot_key, bp);
  if (ka.group !== kb.group) return ka.group - kb.group;
  if (ka.n !== kb.n) return ka.n - kb.n;
  const rawCmp = ka.raw.localeCompare(kb.raw);
  if (rawCmp !== 0) return rawCmp;
  return Number(a.publication_slot_id) - Number(b.publication_slot_id);
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
    await enrichSlotsWithFlatplanPublicationArticleMeta(list, publicationId);
    await enrichSlotsWithFlatplanArticleChunkPreviews(list, publicationId);
    await enrichCoverSlotWithFlatplanComposite(list, publicationId);
    await enrichSummaryAndIndexSlotsWithPdf(list, publicationId);
    list.sort(compareSlotsPublicationOrder);

    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  slot_key: Joi.string().trim().min(1).required(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  publication_page: Joi.number().optional(),
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

    const slotKeyRaw = String(body.slot_key).trim();
    const slotKeyLower = slotKeyRaw.toLowerCase();

    if (!ALLOWED_SLOT_KEYS.has(slotKeyLower)) {
      return NextResponse.json(
        {
          message:
            "slot_key must be one of: cover, inside_cover, end, preferential_page, regular_page.",
        },
        { status: 400 }
      );
    }

    const pid = String(publicationId);

    const pageFromBody = body.publication_page != null ? Number(body.publication_page) : null;

    let publication_page;
    if (slotKeyLower === "cover") {
      publication_page = -1;
      const existing = await PublicationSlotDbModel.findOne({
        where: { publication_id: pid, slot_key: slotKeyLower },
      });
      if (existing) return NextResponse.json(toApiSlot(existing));
    } else if (slotKeyLower === "inside_cover") {
      publication_page = 0;
      const existing = await PublicationSlotDbModel.findOne({
        where: { publication_id: pid, slot_key: slotKeyLower },
      });
      if (existing) return NextResponse.json(toApiSlot(existing));
    } else if (slotKeyLower === "end") {
      publication_page = pageFromBody != null && Number.isFinite(pageFromBody) ? pageFromBody : 10;
      const existing = await PublicationSlotDbModel.findOne({
        where: { publication_id: pid, slot_key: slotKeyLower },
      });
      if (existing) return NextResponse.json(toApiSlot(existing));
    } else if (slotKeyLower === "preferential_page") {
      if (pageFromBody == null || !Number.isFinite(pageFromBody)) {
        return NextResponse.json({ message: "publication_page is required for preferential_page (1–9)." }, { status: 400 });
      }
      const rn = Math.round(pageFromBody);
      if (!Number.isInteger(rn) || rn < 1 || rn > 9) {
        return NextResponse.json({ message: "preferential_page publication_page must be an integer 1–9." }, { status: 400 });
      }
      publication_page = rn;
      const existing = await PublicationSlotDbModel.findOne({
        where: {
          publication_id: pid,
          slot_key: slotKeyLower,
          publication_page: rn,
        },
      });
      if (existing) return NextResponse.json(toApiSlot(existing));
    } else if (slotKeyLower === "regular_page") {
      const sequelize = PublicationSlotDbModel.sequelize;
      if (!sequelize) {
        return NextResponse.json({ message: "Database not configured" }, { status: 500 });
      }

      const explicit = pageFromBody != null && Number.isFinite(pageFromBody);
      if (explicit && !Number.isInteger(Number(pageFromBody))) {
        return NextResponse.json(
          { message: "regular_page publication_page must be a whole number (integer)." },
          { status: 400 }
        );
      }

      try {
        const row = await sequelize.transaction(async (transaction) => {
          let publication_page;
          if (explicit) {
            publication_page = Number(pageFromBody);
            const endRow = await PublicationSlotDbModel.findOne({
              where: { publication_id: pid, slot_key: "end" },
              transaction,
              lock: transaction.LOCK.UPDATE,
            });
            if (!endRow) {
              const err = new Error("NO_END");
              err.code = "NO_END";
              throw err;
            }
            const endPg = Math.round(Number(endRow.get("publication_page")));
            if (!(publication_page > 9 && publication_page <= endPg)) {
              const err = new Error("BAD_PAGE");
              err.code = "BAD_PAGE";
              err.endPg = endPg;
              throw err;
            }
          } else {
            publication_page = await computeNextRegularPublicationPage(pid, { transaction });
          }

          await shiftPublicationSlotsForRegularInsert(pid, publication_page, { transaction });

          return PublicationSlotDbModel.create(
            {
              publication_id: pid,
              publication_format: body.publication_format ?? "flipbook",
              slot_key: slotKeyLower,
              publication_page: Number(publication_page),
              slot_ordinal: Number(publication_page) + 1,
              slot_content_type: body.slot_content_type ?? "",
              slot_state: body.slot_state ?? "pending",
              customer_id: body.customer_id ? String(body.customer_id) : null,
              project_id: body.project_id ? String(body.project_id) : null,
              slot_media_url: body.slot_media_url ? String(body.slot_media_url) : null,
              slot_article_id: body.slot_article_id ? String(body.slot_article_id) : null,
            },
            { transaction }
          );
        });

        triggerRegeneratePublicationIndexAndSummary(pid);

        return NextResponse.json(toApiSlot(row));
      } catch (e) {
        if (e && e.code === "NO_END") {
          return NextResponse.json({ message: "Publication has no end slot." }, { status: 400 });
        }
        if (e && e.code === "BAD_PAGE") {
          return NextResponse.json(
            {
              message: `Choose an integer page strictly greater than 9 and less than or equal to the current end slot page (${e.endPg}). Existing slots at or after that page (including end) shift forward by one.`,
            },
            { status: 400 }
          );
        }
        throw e;
      }
    }

    if (!Number.isFinite(Number(publication_page))) {
      return NextResponse.json({ message: "Could not resolve publication_page for new slot." }, { status: 400 });
    }

    const slot_ordinal = Number(publication_page) + 1;

    const row = await PublicationSlotDbModel.create({
      publication_id: pid,
      publication_format: body.publication_format ?? "flipbook",
      slot_key: slotKeyLower,
      publication_page: Number(publication_page),
      slot_ordinal,
      slot_content_type: body.slot_content_type ?? "",
      slot_state: body.slot_state ?? "pending",
      customer_id: body.customer_id ? String(body.customer_id) : null,
      project_id: body.project_id ? String(body.project_id) : null,
      slot_media_url: body.slot_media_url ? String(body.slot_media_url) : null,
      slot_article_id: body.slot_article_id ? String(body.slot_article_id) : null,
    });

    triggerRegeneratePublicationIndexAndSummary(pid);

    return NextResponse.json(toApiSlot(row));
  },
  postSchema,
  true
);
