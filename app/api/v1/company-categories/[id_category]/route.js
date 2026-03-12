import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
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

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/company-categories\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_category not found in URL");
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
  async (request) => {
    const id_category = getIdFromRequest(request);
    const list = readCategories();
    const category = list.find(
      (c) => String(c.id_category) === String(id_category)
    );
    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }
    return NextResponse.json(category);
  },
  null,
  true
);

export const DELETE = createEndpoint(
  async (request) => {
    const id_category = getIdFromRequest(request);
    const list = readCategories();
    const index = list.findIndex((c) => String(c.id_category) === String(id_category));
    if (index === -1) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }
    list.splice(index, 1);
    writeCategories(list);
    return NextResponse.json({ message: "Category deleted" });
  },
  null,
  true
);
