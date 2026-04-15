import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationModel } from "../../../../../server/database/models.js";
import "../../../../../server/database/models.js";

export const runtime = "nodejs";

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

const putSchema = Joi.object({
  magazine_id: Joi.string().allow(null, "").optional(),
  publication_year: Joi.number().integer().allow(null).optional(),
  publication_edition_name: Joi.string().allow("").optional(),
  magazine_general_issue_number: Joi.number().integer().allow(null).optional(),
  magazine_this_year_issue: Joi.number().integer().allow(null).optional(),
  publication_expected_publication_month: Joi.number().integer().min(1).max(12).allow(null).optional(),
  real_publication_month_date: Joi.string().allow(null, "").optional(), // YYYY-MM-DD
  publication_materials_deadline: Joi.string().allow(null, "").optional(), // YYYY-MM-DD
  is_special_edition: Joi.boolean().optional(),
  publication_theme: Joi.string().allow("").optional(),
  publication_status: Joi.string().valid("planned", "draft", "published").optional(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  publication_main_image_url: Joi.string().allow("").optional(),
});

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    const row = await PublicationModel.findByPk(String(id));
    if (!row) return NextResponse.json({ message: "Publication not found" }, { status: 404 });
    return NextResponse.json(toApiPublication(row));
  },
  null,
  true
);

export const PUT = createEndpoint(
  async (_request, body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    const row = await PublicationModel.findByPk(String(id));
    if (!row) return NextResponse.json({ message: "Publication not found" }, { status: 404 });

    const updates = {};
    if (body.magazine_id !== undefined) updates.magazine_id = body.magazine_id || null;
    if (body.publication_year !== undefined) updates.publication_year = body.publication_year == null ? null : Number(body.publication_year);
    if (body.publication_edition_name !== undefined) updates.publication_edition_name = String(body.publication_edition_name ?? "");
    if (body.magazine_general_issue_number !== undefined) {
      updates.magazine_general_issue_number = body.magazine_general_issue_number == null ? null : Number(body.magazine_general_issue_number);
    }
    if (body.magazine_this_year_issue !== undefined) {
      updates.magazine_this_year_issue = body.magazine_this_year_issue == null ? null : Number(body.magazine_this_year_issue);
    }
    if (body.publication_expected_publication_month !== undefined) {
      updates.publication_expected_publication_month =
        body.publication_expected_publication_month == null ? null : Number(body.publication_expected_publication_month);
    }
    if (body.real_publication_month_date !== undefined) updates.real_publication_month_date = body.real_publication_month_date || null;
    if (body.publication_materials_deadline !== undefined) updates.publication_materials_deadline = body.publication_materials_deadline || null;
    if (body.is_special_edition !== undefined) updates.is_special_edition = Boolean(body.is_special_edition);
    if (body.publication_theme !== undefined) updates.publication_theme = String(body.publication_theme ?? "");
    if (body.publication_status !== undefined) updates.publication_status = String(body.publication_status);
    if (body.publication_format !== undefined) updates.publication_format = String(body.publication_format);
    if (body.publication_main_image_url !== undefined) updates.publication_main_image_url = String(body.publication_main_image_url ?? "");

    await row.update(updates);
    return NextResponse.json(toApiPublication(row));
  },
  putSchema,
  true
);

