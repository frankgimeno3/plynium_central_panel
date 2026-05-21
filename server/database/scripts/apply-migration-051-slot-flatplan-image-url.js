/**
 * Applies migration 051 (slot_flatplan_image_url).
 *
 * Usage (from plynium_central_panel):
 *   node --env-file=.env server/database/scripts/apply-migration-051-slot-flatplan-image-url.js
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const caPath = path.resolve(process.cwd(), "certs", "rds-ca.pem");
let ssl = { require: true, rejectUnauthorized: false };
if (fs.existsSync(caPath)) {
  ssl = {
    require: true,
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: process.env.NODE_ENV !== "development",
  };
}

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_NAME,
  DATABASE_USER,
  DATABASE_PASSWORD,
} = process.env;

const required = [
  "DATABASE_HOST",
  "DATABASE_PORT",
  "DATABASE_NAME",
  "DATABASE_USER",
  "DATABASE_PASSWORD",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const client = new pg.Client({
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  database: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  ssl,
});

const sql = `
ALTER TABLE public.publication_slots_db
  ADD COLUMN IF NOT EXISTS slot_flatplan_image_url VARCHAR(512) NULL;
`;

try {
  await client.connect();
  await client.query(sql);
  console.log("[migration-051] slot_flatplan_image_url column is ready.");
} catch (e) {
  console.error("[migration-051] failed:", e?.message ?? e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
