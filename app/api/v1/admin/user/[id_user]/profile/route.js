import { createEndpoint } from "../../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import { updateUserProfileFieldsInRds } from "../../../../../../../server/features/user/userRepository.js";
import { updateUser as cognitoUpdateUser } from "../../../../../../../server/features/user/UserSerivce.js";

export const runtime = "nodejs";

function getIdUserFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/admin\/user\/([^/]+)\/profile/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  return null;
}

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_user = getIdUserFromRequest(request);
    if (!id_user) {
      return NextResponse.json({ message: "id_user required" }, { status: 400 });
    }

    const updated = await updateUserProfileFieldsInRds(id_user, {
      user_name: body.user_name,
      user_surnames: body.user_surnames,
      user_description: body.user_description,
      user_role: body.user_role,
    });

    const fullName =
      String(body.user_full_name ?? "").trim() ||
      [body.user_name, body.user_surnames].filter(Boolean).join(" ").trim();
    const cognitoUsername = String(updated.id_user ?? "").trim();
    if (fullName && cognitoUsername) {
      try {
        await cognitoUpdateUser({
          username: cognitoUsername,
          name: fullName,
          email: undefined,
          enabled: undefined,
        });
      } catch (e) {
        console.warn("[profile PATCH] Cognito name sync failed:", e?.message || e);
      }
    }

    return NextResponse.json(updated);
  },
  Joi.object({
    user_full_name: Joi.string().allow("").optional(),
    user_name: Joi.string().allow("").optional(),
    user_surnames: Joi.string().allow("").optional(),
    user_role: Joi.string().allow("").optional(),
    user_description: Joi.string().allow("").optional(),
  }),
  true,
  []
);
