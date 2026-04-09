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
  periodicity: Joi.string().allow("").optional(),
  subscriber_number: Joi.number().integer().allow(null).optional(),
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
      periodicity: body.periodicity != null ? String(body.periodicity).trim() : undefined,
      subscriber_number: body.subscriber_number,
      issues_by_year: body.issues_by_year,
    });
    return NextResponse.json(newMagazine);
  },
  postSchema,
  true
);
