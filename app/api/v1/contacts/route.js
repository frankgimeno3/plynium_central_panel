import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getAllContacts, createContact } from "../../../../server/features/contact_db/ContactDbService.js";

export const runtime = "nodejs";

export const GET = createEndpoint(
  async () => {
    const list = await getAllContacts();
    return NextResponse.json(list);
  },
  null,
  true
);

export const POST = createEndpoint(
  async (request, body) => {
    const contact = await createContact(body);
    return NextResponse.json(contact);
  },
  null,
  false
);
