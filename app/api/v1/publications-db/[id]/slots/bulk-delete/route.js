import { createEndpoint } from "@/server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { Op } from "sequelize";
import {
  PublicationSlotDbModel,
  PublicationPreferentialSlotDbModel,
  PublicationArticleDbModel,
  PublicationArticleChunkDbModel,
  ProjectDbModel,
  OfferedPreferentialPageDbModel,
} from "@/server/database/models.js";
import "@/server/database/models.js";
import { compactPublicationSlotsAfterDelete } from "@/server/features/publication/compactPublicationSlotsAfterDelete.js";
import { triggerRegeneratePublicationIndexAndSummary } from "@/server/features/publication/PublicationIndexSummaryService.js";

export const runtime = "nodejs";

const postSchema = Joi.object({
  publication_slot_ids: Joi.array()
    .items(Joi.number().integer().positive())
    .min(1)
    .max(200)
    .required(),
});

const LOCKED_SLOT_KEYS = new Set([
  "cover",
  "inside_cover",
  "inside cover",
  "end",
  "end_page",
  "end page",
]);

function isProtectedSlotKey(row) {
  const key = String(row.get("slot_key") ?? "").trim().toLowerCase();
  if (LOCKED_SLOT_KEYS.has(key)) return true;
  if (key === "preferential_page") {
    const pp = Number(row.get("publication_page"));
    if (!Number.isFinite(pp)) return true;
    const rn = Math.round(pp);
    return rn >= 1 && rn <= 9;
  }
  return false;
}

/**
 * When any slot of a `publication_articles` spread is removed, delete every slot in
 * that spread and remove the publication article row + all of its chunks.
 */
async function resolveBulkDeletePlan(publicationId, requestedIds, transaction) {
  const requested = [
    ...new Set(requestedIds.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)),
  ];
  const requestedSet = new Set(requested);
  const expandedSlotIds = new Set(requested);
  const publicationArticleIds = new Set();

  const articles = await PublicationArticleDbModel.findAll({
    where: { publication_id: String(publicationId) },
    transaction,
  });

  for (const ap of articles) {
    const paId = String(ap.get("publication_article_id") ?? "").trim();
    if (!paId) continue;
    const arr = Array.isArray(ap.get("publication_slots_id_array"))
      ? ap
          .get("publication_slots_id_array")
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];
    if (!arr.some((sid) => requestedSet.has(sid))) continue;
    publicationArticleIds.add(paId);
    for (const sid of arr) expandedSlotIds.add(sid);
  }

  const selectedSlots = await PublicationSlotDbModel.findAll({
    where: { publication_slot_id: { [Op.in]: requested } },
    transaction,
  });

  for (const row of selectedSlots) {
    const articleId = row.get("slot_article_id");
    if (articleId == null || String(articleId).trim() === "") continue;
    const aid = String(articleId).trim();
    const pa = articles.find((a) => String(a.get("article_id") ?? "").trim() === aid);
    if (!pa) continue;
    const paId = String(pa.get("publication_article_id") ?? "").trim();
    if (!paId) continue;
    publicationArticleIds.add(paId);
    const arr = Array.isArray(pa.get("publication_slots_id_array"))
      ? pa
          .get("publication_slots_id_array")
          .map((n) => Number(n))
          .filter((n) => Number.isFinite(n) && n > 0)
      : [];
    for (const sid of arr) expandedSlotIds.add(sid);
  }

  return {
    publication_slot_ids: [...expandedSlotIds],
    publication_article_ids: [...publicationArticleIds],
  };
}

export const POST = createEndpoint(
  async (_request, body, params) => {
    const publicationId = params?.id;
    if (!publicationId) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    if (!PublicationSlotDbModel?.sequelize) {
      return NextResponse.json({ message: "Database not configured" }, { status: 500 });
    }

    const requestedIds = [
      ...new Set(body.publication_slot_ids.map((n) => Number(n)).filter((n) => Number.isFinite(n))),
    ];
    if (requestedIds.length === 0) {
      return NextResponse.json({ message: "No valid slot ids" }, { status: 400 });
    }

    const sequelize = PublicationSlotDbModel.sequelize;

    const plan = await sequelize.transaction((transaction) =>
      resolveBulkDeletePlan(publicationId, requestedIds, transaction)
    );

    const ids = plan.publication_slot_ids;
    if (ids.length === 0) {
      return NextResponse.json({ message: "No valid slot ids" }, { status: 400 });
    }

    const rows = await PublicationSlotDbModel.findAll({
      where: {
        publication_id: String(publicationId),
        publication_slot_id: { [Op.in]: ids },
      },
    });

    if (rows.length !== ids.length) {
      return NextResponse.json(
        { message: "One or more slots were not found for this publication." },
        { status: 400 }
      );
    }

    const blocked = [];
    for (const row of rows) {
      if (isProtectedSlotKey(row)) {
        blocked.push(String(row.get("slot_key") ?? "").trim());
      }
    }
    if (blocked.length > 0) {
      return NextResponse.json(
        {
          message: `Cannot delete protected slots: ${[...new Set(blocked)].join(", ")}`,
        },
        { status: 400 }
      );
    }

    const paIds = plan.publication_article_ids;

    await sequelize.transaction(async (transaction) => {
      if (paIds.length > 0 && PublicationArticleChunkDbModel?.sequelize) {
        await PublicationArticleChunkDbModel.destroy({
          where: { publication_article_id: { [Op.in]: paIds } },
          transaction,
        });
        await PublicationArticleDbModel.destroy({
          where: { publication_article_id: { [Op.in]: paIds } },
          transaction,
        });
      }

      await ProjectDbModel.update(
        { publication_id: null, publication_slot_id: null },
        { where: { publication_slot_id: { [Op.in]: ids } }, transaction }
      );

      await OfferedPreferentialPageDbModel.update(
        { publication_slot_id: null },
        { where: { publication_slot_id: { [Op.in]: ids } }, transaction }
      );

      await PublicationPreferentialSlotDbModel.destroy({
        where: { publication_slot_id: { [Op.in]: ids } },
        transaction,
      });

      await PublicationSlotDbModel.destroy({
        where: { publication_slot_id: { [Op.in]: ids } },
        transaction,
      });

      await compactPublicationSlotsAfterDelete(publicationId, { transaction });
    });

    triggerRegeneratePublicationIndexAndSummary(String(publicationId));

    return NextResponse.json({
      ok: true,
      deleted: ids.length,
      deleted_publication_articles: paIds.length,
    });
  },
  postSchema,
  true
);
