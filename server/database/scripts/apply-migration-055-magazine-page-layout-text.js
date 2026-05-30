/**
 * Applies migration 055 (magazine_page_layout → TEXT on publication_slots_db).
 *
 * Usage (from plynium_central_panel):
 *   node --env-file=.env server/database/scripts/apply-migration-055-magazine-page-layout-text.js
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
  ALTER COLUMN magazine_page_layout TYPE TEXT USING magazine_page_layout::TEXT;
`;

try {
  await client.connect();
  await client.query(sql);
  console.log("[migration-055] magazine_page_layout is TEXT.");
} catch (e) {
  console.error("[migration-055] failed:", e?.message ?? e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
