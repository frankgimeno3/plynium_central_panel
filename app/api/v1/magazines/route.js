import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const MAGAZINES_FILE = path.join(DATA_DIR, "magazines.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readMagazines() {
  ensureDataDir();
  if (!fs.existsSync(MAGAZINES_FILE)) return [];
  try {
    const raw = fs.readFileSync(MAGAZINES_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeMagazines(list) {
  ensureDataDir();
  fs.writeFileSync(MAGAZINES_FILE, JSON.stringify(list, null, 2), "utf8");
}

export const GET = createEndpoint(
  async () => {
    const list = readMagazines();
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  name: Joi.string().required().trim().min(1),
  portalId: Joi.number().integer().min(1).required(),
  description: Joi.string().allow("").optional(),
});

export const POST = createEndpoint(
  async (request, body) => {
    const list = readMagazines();
    const id =
      list.length > 0
        ? String(Math.max(...list.map((m) => parseInt(m.id, 10) || 0)) + 1)
        : "1";
    const name = String(body.name).trim();
    const portalId = Number(body.portalId);
    const description = String(body.description ?? "").trim();
    const newMagazine = {
      id,
      name,
      portalId,
      description,
    };
    list.push(newMagazine);
    writeMagazines(list);
    return NextResponse.json(newMagazine);
  },
  postSchema,
  false
);
