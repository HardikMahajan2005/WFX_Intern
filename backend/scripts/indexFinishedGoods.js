import "dotenv/config";
import pg from "pg";
import { typesenseClient } from "../src/config/typesense.js";

const SCHEMA_NAME = "finished_goods";

async function indexFinishedGoods() {
  console.log("🚀 Starting Typesense indexing for finished_goods...");

  // 1. Define schema
  const schema = {
    name: SCHEMA_NAME,
    fields: [
      { name: "id", type: "string" }, // Maps to style_number
      { name: "style_number", type: "string" },
      { name: "style_name", type: "string" },
      { name: "category", type: "string", facet: true },
      { name: "fabric", type: "string", facet: true },
      { name: "gsm", type: "int32" },
      { name: "color", type: "string", facet: true },
      { name: "print", type: "string", facet: true },
      { name: "season", type: "string", facet: true },
      { name: "brand", type: "string", facet: true },
      { name: "supplier_name", type: "string" },
      { name: "selling_price", type: "float" },
      { name: "image_url", type: "string", optional: true },
    ],
  };

  // 2. Re-create collection
  try {
    console.log(`Checking if collection '${SCHEMA_NAME}' exists...`);
    await typesenseClient.collections(SCHEMA_NAME).retrieve();
    console.log(`Collection '${SCHEMA_NAME}' exists. Deleting it...`);
    await typesenseClient.collections(SCHEMA_NAME).delete();
  } catch (err) {
    // Collection doesn't exist, proceed
  }

  console.log(`Creating collection '${SCHEMA_NAME}'...`);
  await typesenseClient.collections().create(schema);
  console.log(`Collection '${SCHEMA_NAME}' created successfully.`);

  // 3. Fetch finished goods using direct pg connection (to avoid PGRST002 PostgREST schema-cache issue)
  console.log("Fetching finished goods from Postgres database...");
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.startsWith("postgresql://")) {
    console.error("❌ DATABASE_URL is not configured in .env");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  let goods = [];
  try {
    const { rows } = await client.query(`
      SELECT fg.*, s.company_name AS supplier_name
      FROM finished_goods fg
      LEFT JOIN suppliers s ON fg.supplier_id = s.supplier_id
    `);
    goods = rows;
  } finally {
    client.release();
    await pool.end();
  }

  console.log(`Fetched ${goods.length} items from database.`);

  // 4. Format documents for Typesense
  const documents = goods.map((g) => ({
    id: g.style_number,
    style_number: g.style_number,
    style_name: g.style_name,
    category: g.category || "N/A",
    fabric: g.fabric || "N/A",
    gsm: parseInt(g.gsm, 10) || 0,
    color: g.color || "N/A",
    print: g.print || "N/A",
    season: g.season || "N/A",
    brand: g.brand || "N/A",
    supplier_name: g.supplier_name || "N/A",
    selling_price: parseFloat(g.selling_price) || 0.0,
    image_url: g.image_url || "",
  }));

  // 5. Index in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    try {
      console.log(`Indexing batch ${i} to ${i + batch.length}...`);
      await typesenseClient.collections(SCHEMA_NAME).documents().import(batch, {
        action: "upsert",
      });
    } catch (err) {
      console.error("❌ Error importing batch:", err);
    }
  }

  console.log("✅ Typesense indexing complete!");
}

indexFinishedGoods().catch((err) => {
  console.error("❌ Unhandled index error:", err);
  process.exit(1);
});
