import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function listFinishedGoods(filters) {
  const {
    category, fabric, color, print, season, supplier,
    gsm_min, gsm_max, page, limit, sort_by, sort_order,
  } = filters;

  const offset = (page - 1) * limit;

  let queryText = `
    SELECT fg.*, 
           json_build_object(
             'company_name', s.company_name,
             'country', s.country,
             'lead_time_days', s.lead_time_days,
             'rating', s.rating
           ) as suppliers
    FROM finished_goods fg
    LEFT JOIN suppliers s ON fg.supplier_id = s.supplier_id
  `;

  let countQueryText = `
    SELECT COUNT(*) FROM finished_goods fg
    LEFT JOIN suppliers s ON fg.supplier_id = s.supplier_id
  `;

  const conditions = [];
  const params = [];
  let paramIdx = 1;

  if (category) {
    conditions.push(`fg.category ILIKE $${paramIdx}`);
    params.push(`%${category}%`);
    paramIdx++;
  }
  if (fabric) {
    conditions.push(`fg.fabric ILIKE $${paramIdx}`);
    params.push(`%${fabric}%`);
    paramIdx++;
  }
  if (color) {
    conditions.push(`fg.color ILIKE $${paramIdx}`);
    params.push(`%${color}%`);
    paramIdx++;
  }
  if (print) {
    conditions.push(`fg.print ILIKE $${paramIdx}`);
    params.push(`%${print}%`);
    paramIdx++;
  }
  if (season) {
    conditions.push(`fg.season ILIKE $${paramIdx}`);
    params.push(`%${season}%`);
    paramIdx++;
  }
  if (gsm_min !== undefined) {
    conditions.push(`fg.gsm >= $${paramIdx}`);
    params.push(gsm_min);
    paramIdx++;
  }
  if (gsm_max !== undefined) {
    conditions.push(`fg.gsm <= $${paramIdx}`);
    params.push(gsm_max);
    paramIdx++;
  }
  if (supplier) {
    conditions.push(`s.company_name ILIKE $${paramIdx}`);
    params.push(`%${supplier}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";
  queryText += whereClause;
  countQueryText += whereClause;

  const allowedSortCols = [
    "style_number", "style_name", "category", "fabric", 
    "gsm", "color", "print", "season", "brand", "cost", 
    "selling_price", "created_at"
  ];
  const finalSortCol = allowedSortCols.includes(sort_by) ? sort_by : "created_at";
  const finalSortOrder = sort_order === "asc" ? "ASC" : "DESC";

  queryText += ` ORDER BY fg.${finalSortCol} ${finalSortOrder} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
  
  const finalParams = [...params, limit, offset];

  const client = await pool.connect();
  try {
    const [dataRes, countRes] = await Promise.all([
      client.query(queryText, finalParams),
      client.query(countQueryText, params),
    ]);

    return {
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10) || 0,
    };
  } finally {
    client.release();
  }
}

export async function getFinishedGoodById(id) {
  const query = `
    SELECT fg.*,
           json_build_object(
             'company_name', s.company_name,
             'country', s.country,
             'contact', s.contact,
             'lead_time_days', s.lead_time_days,
             'rating', s.rating
           ) as suppliers,
           COALESCE(
             (
               SELECT json_agg(json_build_object(
                 'fabric_details', tp.fabric_details,
                 'construction', tp.construction,
                 'wash_instructions', tp.wash_instructions
               ))
               FROM tech_packs tp
               WHERE tp.style_number = fg.style_number
             ),
             '[]'::json
           ) as tech_packs
    FROM finished_goods fg
    LEFT JOIN suppliers s ON fg.supplier_id = s.supplier_id
    WHERE fg.style_number = $1
  `;

  const client = await pool.connect();
  try {
    const { rows } = await client.query(query, [id]);
    return rows[0] || null;
  } finally {
    client.release();
  }
}

export async function getFilterOptions() {
  const client = await pool.connect();
  try {
    const queries = {
      categories: "SELECT DISTINCT category FROM finished_goods WHERE category IS NOT NULL ORDER BY category",
      fabrics: "SELECT DISTINCT fabric FROM finished_goods WHERE fabric IS NOT NULL ORDER BY fabric",
      colors: "SELECT DISTINCT color FROM finished_goods WHERE color IS NOT NULL ORDER BY color",
      prints: "SELECT DISTINCT print FROM finished_goods WHERE print IS NOT NULL ORDER BY print",
      seasons: "SELECT DISTINCT season FROM finished_goods WHERE season IS NOT NULL ORDER BY season",
      brands: "SELECT DISTINCT brand FROM finished_goods WHERE brand IS NOT NULL ORDER BY brand",
      suppliers: "SELECT supplier_id, company_name FROM suppliers ORDER BY company_name",
      buyers: "SELECT buyer_id, company_name FROM buyers ORDER BY company_name",
      gsmRange: "SELECT MIN(gsm) as min_gsm, MAX(gsm) as max_gsm FROM finished_goods",
    };

    const results = {};
    const keys = Object.keys(queries);

    await Promise.all(
      keys.map(async (key) => {
        const { rows } = await client.query(queries[key]);
        if (key === "gsmRange") {
          results[key] = rows[0] || { min_gsm: 0, max_gsm: 500 };
        } else if (key === "suppliers" || key === "buyers") {
          results[key] = rows;
        } else {
          results[key] = rows.map((r) => r[Object.keys(r)[0]]);
        }
      })
    );

    return results;
  } finally {
    client.release();
  }
}
