import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "product_categories.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCategories() {
  ensureDataDir();
  if (!fs.existsSync(FILE_PATH)) return [];
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeCategories(list) {
  ensureDataDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), "utf8");
}

export const GET = createEndpoint(
  async () => {
    const list = readCategories();
    return NextResponse.json(list);
  },
  null,
  true
);

const postSchema = Joi.object({
  name: Joi.string().required().trim().min(1),
  portals_array: Joi.array().items(Joi.string().trim()).min(1).required(),
});

export const POST = createEndpoint(
  async (request, body) => {
    const list = readCategories();
    const name = String(body.name).trim();
    const exists = list.some((c) => String(c.name).toLowerCase() === name.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { message: "A product category with this name already exists" },
        { status: 400 }
      );
    }
    const id =
      list.length > 0
        ? String(Math.max(...list.map((c) => parseInt(c.id_category, 10) || 0)) + 1)
        : "1";
    const portals_array = Array.isArray(body.portals_array)
      ? body.portals_array.map((p) => String(p).trim()).filter(Boolean)
      : [];
    const newCategory = {
      id_category: id,
      name,
      portals_array,
    };
    list.push(newCategory);
    writeCategories(list);
    return NextResponse.json(newCategory);
  },
  postSchema,
  false
);
