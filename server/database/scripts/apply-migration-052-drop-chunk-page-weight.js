/**
 * Applies migration 052 (dedupe grid areas + drop chunk_page_weight).
 *
 * Usage (from plynium_central_panel):
 *   node --env-file=.env server/database/scripts/apply-migration-052-drop-chunk-page-weight.js
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

const sqlPath = path.resolve(
  process.cwd(),
  "server/database/migrations/052_drop_chunk_page_weight_dedupe_grid_areas.sql"
);
const sql = fs.readFileSync(sqlPath, "utf8");

const client = new pg.Client({
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  database: DATABASE_NAME,
  user: DATABASE_USER,
  password: DATABASE_PASSWORD,
  ssl,
});

await client.connect();
try {
  await client.query(sql);
  console.log("[migration-052] Grid area dedupe, unique index, and chunk_page_weight drop are ready.");
} finally {
  await client.end();
}
