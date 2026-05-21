import pg from "pg";
import fs from "fs";

const caPath = "certs/rds-ca.pem";
let ssl = { require: true, rejectUnauthorized: false };
if (fs.existsSync(caPath)) {
  ssl = {
    require: true,
    ca: fs.readFileSync(caPath, "utf8"),
    rejectUnauthorized: process.env.NODE_ENV !== "development",
  };
}

const articleId = process.argv[2] ?? "0c6882a6-5f09-4135-b1c3-9c3f67528bda";
const client = new pg.Client({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl,
});

await client.connect();
const r = await client.query(
  `SELECT publication_slot_id, lower(btrim(chunk_area_array->>0)) AS area, count(*)::int AS n,
          array_agg(chunk_position ORDER BY publication_article_chunk_updated_at DESC) AS positions
   FROM publication_article_chunks
   WHERE publication_article_id = $1
     AND publication_article_chunk_format = 'only_text'
     AND publication_slot_id IS NOT NULL
     AND btrim(coalesce(chunk_area_array->>0,'')) <> ''
   GROUP BY 1,2 HAVING count(*) > 1
   ORDER BY 1,2`,
  [articleId]
);
console.log("duplicate only_text areas:", r.rows.length);
console.log(JSON.stringify(r.rows, null, 2));

const all = await client.query(
  `SELECT publication_slot_id, lower(btrim(chunk_area_array->>0)) AS area,
          publication_article_chunk_format AS fmt, chunk_position, publication_article_chunk_updated_at
   FROM publication_article_chunks
   WHERE publication_article_id = $1
   ORDER BY publication_slot_id, chunk_position`,
  [articleId]
);
console.log("total chunks:", all.rows.length);
for (const row of all.rows) {
  console.log(
    `slot=${row.publication_slot_id} pos=${row.chunk_position} fmt=${row.fmt} area=${row.area ?? "(empty)"}`
  );
}
await client.end();
