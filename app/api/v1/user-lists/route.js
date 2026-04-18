import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  createNewsletterUserListsInRds,
  getUserListsFromRds,
} from "../../../../server/features/user/userRepository.js";

const getSchema = Joi.object({
  portal_id: Joi.number().integer().optional(),
}).unknown(true);

const postSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().allow("", null).max(10000).optional().default(""),
  portals: Joi.array()
    .items(
      Joi.object({
        portalId: Joi.number().integer().min(0).required(),
        listType: Joi.string().valid("main", "specific").required(),
      })
    )
    .min(1)
    .required(),
  userIds: Joi.array().items(Joi.string().uuid()).optional().default([]),
}).unknown(true);

export const GET = createEndpoint(
  async (_request, query) => {
    const raw = query?.portal_id;
    const portalId =
      raw != null && raw !== "" && Number.isFinite(Number(raw)) ? Number(raw) : null;
    const lists = await getUserListsFromRds({ portalId });
    return NextResponse.json(lists);
  },
  getSchema,
  true,
  []
);

export const POST = createEndpoint(
  async (_request, body) => {
    const created = await createNewsletterUserListsInRds({
      name: body.name,
      description: body.description ?? "",
      portals: body.portals,
      userIds: body.userIds ?? [],
    });
    return NextResponse.json(created, { status: 201 });
  },
  postSchema,
  true,
  []
);
