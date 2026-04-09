import { createEndpoint } from "../../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getCommentsByContactId, createContactComment } from "../../../../../../server/features/contact_comment_db/ContactCommentDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/contacts\/([^/]+)\/comments/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_contact not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_contact = getIdFromRequest(request);
    const list = await getCommentsByContactId(id_contact);
    return NextResponse.json(list);
  },
  null,
  true
);

export const POST = createEndpoint(
  async (request, body) => {
    const id_contact = getIdFromRequest(request);
    const created = await createContactComment(id_contact, body ?? {});
    return NextResponse.json(created);
  },
  null,
  true
);

