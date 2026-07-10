import { typesenseClient } from "../config/typesense.js";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
});

export async function searchFinishedGoods({ q, category, fabric, color, page = 1, limit = 20 }) {
  try {
    const filters = [];
    if (category) filters.push(`category:=${category}`);
    if (fabric)   filters.push(`fabric:=${fabric}`);
    if (color)    filters.push(`color:=${color}`);

    const searchParams = {
      q: q && q.trim() !== "" ? q.trim() : "*",
      query_by: "style_name,fabric,color,print,category,brand",
      filter_by: filters.length > 0 ? filters.join(" && ") : undefined,
      page,
      per_page: limit,
    };

    const searchResult = await typesenseClient
      .collections("finished_goods")
      .documents()
      .search(searchParams);

    const data = (searchResult.hits || []).map((hit) => {
      const doc = hit.document;
      return {
        style_number:  doc.style_number,
        style_name:    doc.style_name,
        category:      doc.category,
        fabric:        doc.fabric,
        gsm:           doc.gsm,
        color:         doc.color,
        print:         doc.print,
        season:        doc.season,
        brand:         doc.brand,
        supplier_id:   null,
        cost:          null,
        selling_price: doc.selling_price,
        image_url:     doc.image_url,
        created_at:    null,
        suppliers: {
          company_name: doc.supplier_name,
        },
      };
    });

    return {
      data,
      total: searchResult.found || 0,
    };
  } catch (err) {
    const client = await pool.connect();
    try {
      const conditions = [];
      const values = [];
      let paramIndex = 1;

      if (q && q.trim() !== "") {
        const cleanQ = `%${q.trim()}%`;
        conditions.push(`(
          fg.style_name ILIKE $${paramIndex} OR
          fg.fabric ILIKE $${paramIndex} OR
          fg.color ILIKE $${paramIndex} OR
          fg.print ILIKE $${paramIndex} OR
          fg.category ILIKE $${paramIndex} OR
          fg.brand ILIKE $${paramIndex}
        )`);
        values.push(cleanQ);
        paramIndex++;
      }

      if (category) {
        conditions.push(`fg.category = $${paramIndex}`);
        values.push(category);
        paramIndex++;
      }

      if (fabric) {
        conditions.push(`fg.fabric = $${paramIndex}`);
        values.push(fabric);
        paramIndex++;
      }

      if (color) {
        conditions.push(`fg.color = $${paramIndex}`);
        values.push(color);
        paramIndex++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM finished_goods fg
        ${whereClause}
      `;
      const countRes = await client.query(countQuery, values);
      const total = parseInt(countRes.rows[0]?.total || "0", 10);

      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT fg.*, s.company_name AS supplier_name
        FROM finished_goods fg
        LEFT JOIN suppliers s ON fg.supplier_id = s.supplier_id
        ${whereClause}
        ORDER BY fg.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      const queryValues = [...values, limit, offset];
      const dataRes = await client.query(dataQuery, queryValues);

      const data = dataRes.rows.map((row) => ({
        style_number:  row.style_number,
        style_name:    row.style_name,
        category:      row.category,
        fabric:        row.fabric,
        gsm:           row.gsm,
        color:         row.color,
        print:         row.print,
        season:        row.season,
        brand:         row.brand,
        supplier_id:   row.supplier_id,
        cost:          row.cost ? parseFloat(row.cost) : null,
        selling_price: row.selling_price ? parseFloat(row.selling_price) : null,
        image_url:     row.image_url,
        created_at:    row.created_at,
        suppliers: {
          company_name: row.supplier_name,
        },
      }));

      return { data, total };
    } finally {
      client.release();
    }
  }
}
