import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { getMagazineById } from "../../../../../../server/features/magazine_db/MagazineDbService.js";
import {
  listPublicationsForMagazineId,
  createMagazineIssuePublication,
} from "../../../../../../server/features/publication/PublicationService.js";

export const runtime = "nodejs";

function getMagazineIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/magazines\/([^/]+)\/publications/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_magazine not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_magazine = getMagazineIdFromRequest(request);
    try {
      await getMagazineById(id_magazine);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Magazine not found" }, { status: 404 });
      }
      throw err;
    }
    const list = await listPublicationsForMagazineId(id_magazine);
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  publication_year: Joi.number().integer().required(),
  magazine_this_year_issue: Joi.number().integer().min(1).required(),
  publication_expected_publication_month: Joi.number().integer().min(1).max(12).allow(null).optional(),
  is_special_edition: Joi.boolean().optional(),
  publication_theme: Joi.string().allow("").optional(),
  publication_format: Joi.string().valid("informer", "flipbook", "both").optional(),
});

export const POST = createEndpoint(
  async (request, body) => {
    const id_magazine = getMagazineIdFromRequest(request);
    let magazine;
    try {
      magazine = await getMagazineById(id_magazine);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Magazine not found" }, { status: 404 });
      }
      throw err;
    }
    const created = await createMagazineIssuePublication({
      magazineId: id_magazine,
      magazineName: magazine.name,
      publication_year: body.publication_year,
      magazine_this_year_issue: body.magazine_this_year_issue,
      publication_expected_publication_month: body.publication_expected_publication_month ?? null,
      is_special_edition: body.is_special_edition === true,
      publication_theme: body.publication_theme ?? "",
      publication_format: body.publication_format,
    });
    return NextResponse.json(created);
  },
  postSchema,
  true
);
