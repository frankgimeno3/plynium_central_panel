import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  getAllMagazines,
  createMagazine,
  generateNextMagazineId,
} from "../../../../server/features/magazine_db/MagazineDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllMagazines();
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  id_magazine: Joi.string().trim().optional(),
  name: Joi.string().required().trim().min(1),
  description: Joi.string().allow("").optional(),
  first_year: Joi.number().integer().optional(),
  last_year: Joi.number().integer().optional(),
  notes: Joi.string().allow("").optional(),
  portal_name: Joi.string().allow("").optional(),
  issues_by_year: Joi.object().pattern(Joi.string(), Joi.array().items(
    Joi.object({
      issue_number: Joi.number().integer().required(),
      is_special_edition: Joi.boolean().optional(),
      special_topic: Joi.string().allow("").optional(),
    })
  )).optional(),
});

export const POST = createEndpoint(
  async (_request, body) => {
    const list = await getAllMagazines();
    const existingIds = list.map((m) => m.id_magazine);
    const id_magazine = body.id_magazine?.trim() || generateNextMagazineId(existingIds);
    const newMagazine = await createMagazine({
      id_magazine,
      name: String(body.name).trim(),
      description: body.description != null ? String(body.description).trim() : undefined,
      first_year: body.first_year != null ? Number(body.first_year) : undefined,
      last_year: body.last_year != null ? Number(body.last_year) : undefined,
      notes: body.notes != null ? String(body.notes).trim() : undefined,
      portal_name: body.portal_name != null ? String(body.portal_name).trim() : undefined,
      issues_by_year: body.issues_by_year,
    });
    return NextResponse.json(newMagazine);
  },
  postSchema,
  true
);
