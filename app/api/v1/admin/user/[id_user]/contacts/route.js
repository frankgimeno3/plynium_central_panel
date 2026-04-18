import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { setUserContactIdsInRds } from "../../../../../../../server/features/user/userRepository.js";

export const runtime = "nodejs";

function getIdUserFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/admin\/user\/([^/]+)\/contacts/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  return null;
}

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_user = getIdUserFromRequest(request);
    if (!id_user) return NextResponse.json({ message: "id_user required" }, { status: 400 });
    const updated = await setUserContactIdsInRds(id_user, body.contact_id_array);
    return NextResponse.json(updated);
  },
  Joi.object({
    contact_id_array: Joi.array().items(Joi.string().trim().min(1)).required(),
  }),
  true,
  []
);

