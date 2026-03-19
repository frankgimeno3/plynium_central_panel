import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import { getContactById, updateContact, deleteContact } from "../../../../../server/features/contact_db/ContactDbService.js";

export const runtime = "nodejs";

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/contacts\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_contact not found in URL");
}

export const GET = createEndpoint(
  async (request) => {
    const id_contact = getIdFromRequest(request);
    try {
      const contact = await getContactById(id_contact);
      return NextResponse.json(contact);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Contact not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_contact = getIdFromRequest(request);
    try {
      const contact = await updateContact(id_contact, body);
      return NextResponse.json(contact);
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Contact not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);

export const DELETE = createEndpoint(
  async (request) => {
    const id_contact = getIdFromRequest(request);
    try {
      await deleteContact(id_contact);
      return NextResponse.json({ message: "Contact deleted" });
    } catch (err) {
      if (err.message && err.message.includes("not found")) {
        return NextResponse.json({ message: "Contact not found" }, { status: 404 });
      }
      throw err;
    }
  },
  null,
  true
);
