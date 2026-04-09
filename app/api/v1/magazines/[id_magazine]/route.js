import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  getMagazineById,
  updateMagazine,
} from "../../../../../server/features/magazine_db/MagazineDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/magazines\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_magazine not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_magazine = getIdFromRequest(request);
    try {
      const magazine = await getMagazineById(id_magazine);
      return NextResponse.json(magazine);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Magazine not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);

const patchSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  description: Joi.string().allow("").optional(),
  first_year: Joi.number().integer().optional(),
  periodicity: Joi.string().allow("").optional(),
  subscriber_number: Joi.number().integer().allow(null).optional(),
  issues_by_year: Joi.object().pattern(Joi.string(), Joi.array().items(
    Joi.object({
      issue_number: Joi.number().integer().required(),
      is_special_edition: Joi.boolean().optional(),
      special_topic: Joi.string().allow("").optional(),
      forecasted_publication_month: Joi.number().integer().min(1).max(12).allow(null).optional(),
    })
  )).optional(),
});

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_magazine = getIdFromRequest(request);
    try {
      const updated = await updateMagazine(id_magazine, body);
      return NextResponse.json(updated);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Magazine not found" }, { status: 404 });
      }
      throw err;
    }
  },
  patchSchema,
  true
);
