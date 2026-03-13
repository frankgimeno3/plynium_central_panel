import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const CONTENTS_FILE = path.join(process.cwd(), "app", "contents", "magazines.json");

function readMagazines() {
  if (!fs.existsSync(CONTENTS_FILE)) return [];
  try {
    const raw = fs.readFileSync(CONTENTS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeMagazines(list) {
  fs.writeFileSync(CONTENTS_FILE, JSON.stringify(list, null, 2), "utf8");
}

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/magazines\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_magazine not found in URL");
}

const patchSchema = Joi.object({
  name: Joi.string().trim().min(1).optional(),
  description: Joi.string().allow("").optional(),
  notes: Joi.string().allow("").optional(),
});

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_magazine = getIdFromRequest(request);
    const list = readMagazines();
    const index = list.findIndex((m) => String(m.id_magazine) === String(id_magazine));
    if (index === -1) {
      return NextResponse.json({ message: "Magazine not found" }, { status: 404 });
    }
    const current = list[index];
    const updated = {
      ...current,
      ...(body.name !== undefined && { name: String(body.name).trim() }),
      ...(body.description !== undefined && { description: String(body.description ?? "").trim() || undefined }),
      ...(body.notes !== undefined && { notes: String(body.notes ?? "").trim() || undefined }),
    };
    list[index] = updated;
    writeMagazines(list);
    return NextResponse.json(updated);
  },
  patchSchema,
  false
);
