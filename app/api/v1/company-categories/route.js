import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "company_categories.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readCategories() {
  ensureDataDir();
  if (!fs.existsSync(FILE_PATH)) {
    const seedPath = path.join(process.cwd(), "app", "contents", "categoriescontents.json");
    if (fs.existsSync(seedPath)) {
      try {
        const raw = fs.readFileSync(seedPath, "utf8");
        const data = JSON.parse(raw);
        const list = Array.isArray(data) ? data : [];
        writeCategories(list);
        return list;
      } catch {
        return [];
      }
    }
    return [];
  }
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
  description: Joi.string().allow("").optional(),
  portals_array: Joi.array().items(Joi.string().trim()).min(1).required(),
});

export const POST = createEndpoint(
  async (request, body) => {
    const list = readCategories();
    const name = String(body.name).trim();
    const exists = list.some((c) => String(c.name).toLowerCase() === name.toLowerCase());
    if (exists) {
      return NextResponse.json(
        { message: "A company category with this name already exists" },
        { status: 400 }
      );
    }
    const numericIds = list
      .map((c) => {
        const match = String(c.id_category || "").replace(/^cat-/, "").match(/^(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const nextNum = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 1;
    const id_category = `cat-${String(nextNum).padStart(3, "0")}`;
    const portals_array = Array.isArray(body.portals_array)
      ? body.portals_array.map((p) => String(p).trim()).filter(Boolean)
      : [];
    const newCategory = {
      id_category,
      name,
      description: typeof body.description === "string" ? body.description.trim() : "",
      portals_array,
    };
    list.push(newCategory);
    writeCategories(list);
    return NextResponse.json(newCategory);
  },
  postSchema,
  false
);
