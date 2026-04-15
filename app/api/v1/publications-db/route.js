import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationModel } from "../../../../server/database/models.js";
import "../../../../server/database/models.js";

export const runtime = "nodejs";

const getSchema = Joi.object({
  status: Joi.string().optional(), // planned | draft | published (or comma-separated)
  magazine_id: Joi.string().optional(),
  publication_year: Joi.number().integer().optional(),
  publication_format: Joi.string().optional(), // flipbook | informer
});

function toPlain(row) {
  return row && typeof row.get === "function" ? row.get({ plain: true }) : row;
}

function toApiPublication(row) {
  const p = toPlain(row);
  if (!p) return null;
  return {
    publication_id: p.publication_id,
    magazine_id: p.magazine_id ?? null,
    publication_year: p.publication_year ?? null,
    publication_edition_name: p.publication_edition_name ?? "",
    magazine_general_issue_number: p.magazine_general_issue_number ?? null,
    magazine_this_year_issue: p.magazine_this_year_issue ?? null,
    publication_expected_publication_month: p.publication_expected_publication_month ?? null,
    real_publication_month_date: p.real_publication_month_date ?? null,
    publication_materials_deadline: p.publication_materials_deadline ?? null,
    is_special_edition: Boolean(p.is_special_edition),
    publication_theme: p.publication_theme ?? "",
    publication_status: p.publication_status ?? "draft",
    publication_format: p.publication_format ?? "flipbook",
    publication_main_image_url: p.publication_main_image_url ?? "",
  };
}

export const GET = createEndpoint(
  async (_request, query) => {
    if (!PublicationModel?.sequelize) return NextResponse.json([]);

    const where = {};
    if (query?.magazine_id) where.magazine_id = String(query.magazine_id);
    if (query?.publication_year != null && query.publication_year !== "") {
      where.publication_year = Number(query.publication_year);
    }
    if (query?.publication_format) where.publication_format = String(query.publication_format);

    if (query?.status) {
      const raw = String(query.status);
      const statuses = raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (statuses.length === 1) {
        where.publication_status = statuses[0];
      } else if (statuses.length > 1) {
        where.publication_status = statuses;
      }
    }

    const rows = await PublicationModel.findAll({
      where,
      order: [
        ["publication_year", "DESC"],
        ["publication_expected_publication_month", "DESC"],
        ["real_publication_month_date", "DESC"],
        ["publication_id", "DESC"],
      ],
    });

    return NextResponse.json(rows.map(toApiPublication).filter(Boolean));
  },
  getSchema,
  true
);

