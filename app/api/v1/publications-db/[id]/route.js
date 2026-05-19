import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { PublicationModel } from "../../../../../server/database/models.js";
import "../../../../../server/database/models.js";
import { ensurePublicationMediatecaFolder } from "../../../../../server/features/publication/PublicationMediatecaFolderService.js";

export const runtime = "nodejs";

/**
 * Attribute set used as a fallback when one of the new cover-header columns
 * (publication_header_domain / red_box_header / red_box_body) or the special
 * edition subtitle column is not yet present in the RDS schema. Lets the API
 * keep responding while migrations 032 / 033 are pending.
 */
const PUBLICATION_ATTRIBUTES_WITHOUT_COVER_HEADER = [
  "publication_id",
  "magazine_id",
  "publication_year",
  "publication_edition_name",
  "magazine_general_issue_number",
  "magazine_this_year_issue",
  "publication_expected_publication_month",
  "real_publication_month_date",
  "publication_materials_deadline",
  "is_special_edition",
  "publication_theme",
  "publication_status",
  "publication_format",
  "publication_main_image_url",
  "mediateca_folder_id",
];

const COVER_HEADER_COLUMN_NAMES = [
  "publication_header_domain",
  "red_box_header",
  "red_box_body",
  "special_edition_subtitle",
  "publication_cover_flatplan_image_url",
];

function isMissingCoverHeaderColumn(error) {
  const msg = String(error?.message ?? "");
  return (
    error?.name === "SequelizeDatabaseError" &&
    COVER_HEADER_COLUMN_NAMES.some((c) => msg.includes(c))
  );
}

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
    special_edition_subtitle: p.special_edition_subtitle ?? "",
    publication_theme: p.publication_theme ?? "",
    publication_status: p.publication_status ?? "draft",
    publication_format: p.publication_format ?? "flipbook",
    publication_main_image_url: p.publication_main_image_url ?? "",
    publication_cover_flatplan_image_url: p.publication_cover_flatplan_image_url ?? "",
    mediateca_folder_id: p.mediateca_folder_id ?? null,
    publication_header_domain: p.publication_header_domain ?? "",
    red_box_header: p.red_box_header ?? "",
    red_box_body: p.red_box_body ?? "",
  };
}

async function findPublicationByIdSafe(id) {
  try {
    return await PublicationModel.findByPk(String(id));
  } catch (error) {
    if (!isMissingCoverHeaderColumn(error)) throw error;
    return await PublicationModel.findByPk(String(id), {
      attributes: PUBLICATION_ATTRIBUTES_WITHOUT_COVER_HEADER,
    });
  }
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
  special_edition_subtitle: Joi.string().allow("").max(255).optional(),
  publication_theme: Joi.string().allow("").optional(),
  publication_status: Joi.string().valid("planned", "draft", "published").optional(),
  publication_format: Joi.string().valid("flipbook", "informer").optional(),
  publication_main_image_url: Joi.string().allow("").optional(),
  publication_header_domain: Joi.string().allow("").max(255).optional(),
  red_box_header: Joi.string().allow("").max(255).optional(),
  red_box_body: Joi.string().allow("").max(2048).optional(),
});

export const GET = createEndpoint(
  async (_request, _body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    const row = await findPublicationByIdSafe(id);
    if (!row) return NextResponse.json({ message: "Publication not found" }, { status: 404 });
    // Backfill the mediateca folder for legacy publications on first read.
    try {
      await ensurePublicationMediatecaFolder(row);
    } catch (folderErr) {
      console.warn("ensurePublicationMediatecaFolder failed:", folderErr?.message ?? folderErr);
    }
    return NextResponse.json(toApiPublication(row));
  },
  null,
  true
);

export const PUT = createEndpoint(
  async (_request, body, params) => {
    const id = params?.id;
    if (!id) return NextResponse.json({ message: "Missing publication id" }, { status: 400 });
    const row = await findPublicationByIdSafe(id);
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
    if (body.special_edition_subtitle !== undefined) {
      updates.special_edition_subtitle = String(body.special_edition_subtitle ?? "");
    }
    if (body.publication_theme !== undefined) updates.publication_theme = String(body.publication_theme ?? "");
    if (body.publication_status !== undefined) updates.publication_status = String(body.publication_status);
    if (body.publication_format !== undefined) updates.publication_format = String(body.publication_format);
    if (body.publication_main_image_url !== undefined) updates.publication_main_image_url = String(body.publication_main_image_url ?? "");
    if (body.publication_header_domain !== undefined) updates.publication_header_domain = String(body.publication_header_domain ?? "");
    if (body.red_box_header !== undefined) updates.red_box_header = String(body.red_box_header ?? "");
    if (body.red_box_body !== undefined) updates.red_box_body = String(body.red_box_body ?? "");

    try {
      await row.update(updates);
    } catch (error) {
      if (isMissingCoverHeaderColumn(error)) {
        // Retry without the new cover-header fields when migration 032 is pending.
        const safeUpdates = { ...updates };
        for (const c of COVER_HEADER_COLUMN_NAMES) delete safeUpdates[c];
        await row.update(safeUpdates);
      } else {
        throw error;
      }
    }

    // Sync mediateca folder name with publication_edition_name (and lazily
    // backfill for legacy rows that were created before column existed).
    try {
      await ensurePublicationMediatecaFolder(row);
    } catch (folderErr) {
      console.warn("ensurePublicationMediatecaFolder failed:", folderErr?.message ?? folderErr);
    }

    return NextResponse.json(toApiPublication(row));
  },
  putSchema,
  true
);
