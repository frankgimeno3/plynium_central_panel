import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import {
  deleteNewsletterUserListIfSpecificInRds,
  updateNewsletterUserListTypeInRds,
} from "../../../../../server/features/user/userRepository.js";

export const runtime = "nodejs";

const patchSchema = Joi.object({
  newsletter_list_type: Joi.string().valid("main", "specific").required(),
}).unknown(true);

export const PATCH = createEndpoint(
  async (_request, body, routeParams) => {
    const raw = routeParams?.id_list;
    const id_list = raw != null ? decodeURIComponent(String(raw)) : "";
    if (!id_list) {
      return NextResponse.json({ message: "id_list required" }, { status: 400 });
    }
    const updated = await updateNewsletterUserListTypeInRds(id_list, body.newsletter_list_type);
    return NextResponse.json(updated);
  },
  patchSchema,
  true,
  []
);

export const DELETE = createEndpoint(
  async (_request, _body, routeParams) => {
    const raw = routeParams?.id_list;
    const id_list = raw != null ? decodeURIComponent(String(raw)) : "";
    if (!id_list) {
      return NextResponse.json({ message: "id_list required" }, { status: 400 });
    }
    await deleteNewsletterUserListIfSpecificInRds(id_list);
    return NextResponse.json({ ok: true });
  },
  null,
  true,
  []
);
