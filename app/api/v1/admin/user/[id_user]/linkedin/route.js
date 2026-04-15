import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { setUserLinkedinProfileInRds } from "../../../../../../../server/features/user/userRepository.js";

export const runtime = "nodejs";

function getIdUserFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/admin\/user\/([^/]+)\/linkedin/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  return null;
}

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_user = getIdUserFromRequest(request);
    if (!id_user) return NextResponse.json({ message: "id_user required" }, { status: 400 });
    const updated = await setUserLinkedinProfileInRds(id_user, body.linkedin_profile);
    return NextResponse.json(updated);
  },
  Joi.object({
    linkedin_profile: Joi.string().allow("").required(),
  }),
  true,
  ["admin"]
);

