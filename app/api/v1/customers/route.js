import { createEndpoint } from "../../../../server/createEndpoint.js";
import { NextResponse } from "next/server";
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

function readCustomers() {
  ensureDataDir();
  if (!fs.existsSync(FILE_PATH)) {
    if (fs.existsSync(SEED_PATH)) {
      try {
        const raw = fs.readFileSync(SEED_PATH, "utf8");
        const data = JSON.parse(raw);
        const list = Array.isArray(data) ? data : [];
        fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), "utf8");
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

function writeCustomers(list) {
  ensureDataDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(list, null, 2), "utf8");
}

export const GET = createEndpoint(
  async () => {
    const list = readCustomers();
    return NextResponse.json(list);
  },
  null,
  true
);
