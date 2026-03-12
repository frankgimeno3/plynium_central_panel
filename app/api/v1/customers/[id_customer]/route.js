import { createEndpoint } from "../../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
import Joi from "joi";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "customers.json");
const SEED_PATH = path.join(process.cwd(), "app", "contents", "customers.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getIdFromRequest(request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/v1\/customers\/([^/]+)/);
  if (match && match[1]) return decodeURIComponent(match[1]);
  throw new Error("id_customer not found in URL");
}

function readCustomers() {
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

function writeCustomers(list) {
  ensureDataDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), "utf8");
}

function getSeedCustomers() {
  if (!fs.existsSync(SEED_PATH)) return [];
  try {
    const raw = fs.readFileSync(SEED_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const GET = createEndpoint(
  async (request) => {
    const id_customer = getIdFromRequest(request);
    const list = readCustomers();
    let customer = list.find((c) => String(c.id_customer) === String(id_customer));
    if (!customer) {
      const seed = getSeedCustomers();
      customer = seed.find((c) => String(c.id_customer) === String(id_customer));
    }
    if (!customer) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(customer);
  },
  null,
  true
);

const patchSchema = Joi.object({
  company_categories_array: Joi.array().items(Joi.string().trim()).optional(),
});

export const PATCH = createEndpoint(
  async (request, body) => {
    const id_customer = getIdFromRequest(request);
    const list = readCustomers();
    let index = list.findIndex((c) => String(c.id_customer) === String(id_customer));
    if (index === -1) {
      const seed = getSeedCustomers();
      const fromSeed = seed.find((c) => String(c.id_customer) === String(id_customer));
      if (fromSeed) {
        list.push({ ...fromSeed });
        index = list.length - 1;
        writeCustomers(list);
      }
    }
    if (index === -1) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }
    if (body.company_categories_array !== undefined) {
      list[index] = {
        ...list[index],
        company_categories_array: Array.isArray(body.company_categories_array)
          ? body.company_categories_array.filter(Boolean)
          : [],
      };
      writeCustomers(list);
    }
    return NextResponse.json(list[index]);
  },
  patchSchema,
  true
);
