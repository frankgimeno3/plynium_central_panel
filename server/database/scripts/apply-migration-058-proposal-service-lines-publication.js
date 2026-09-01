/**
 * Applies migration 058 (publication_id + is_sold on proposal_service_lines).
 *
 * Usage (from plynium_central_panel):
 *   node --env-file=.env server/database/scripts/apply-migration-058-proposal-service-lines-publication.js
 */
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

const sqlPath = path.join(
  __dirname,
  "..",
  "migrations",
  "058_proposal_service_lines_publication_id_is_sold.sql"
);
const sql = fs.readFileSync(sqlPath, "utf8");

try {
  await client.connect();
  await client.query(sql);
  console.log("[migration-058] proposal_service_lines: publication_id + is_sold applied.");
} catch (e) {
  console.error("[migration-058] failed:", e?.message ?? e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
