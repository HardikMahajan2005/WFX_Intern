import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function getDashboardStats() {
  const client = await pool.connect();
  try {
    const [fgRes, suppRes, buyerRes, orderRes, revRes] = await Promise.all([
      client.query("SELECT COUNT(*) FROM finished_goods"),
      client.query("SELECT COUNT(*) FROM suppliers"),
      client.query("SELECT COUNT(*) FROM buyers"),
      client.query("SELECT COUNT(*) FROM sales_orders"),
      client.query("SELECT SUM(amount) as total FROM sales_invoices WHERE payment_status ILIKE 'paid'"),
    ]);

    return {
      totalFinishedGoods: parseInt(fgRes.rows[0].count, 10) || 0,
      totalSuppliers: parseInt(suppRes.rows[0].count, 10) || 0,
      totalBuyers: parseInt(buyerRes.rows[0].count, 10) || 0,
      totalOrders: parseInt(orderRes.rows[0].count, 10) || 0,
      totalRevenue: Math.round((parseFloat(revRes.rows[0].total) || 0) * 100) / 100,
      revenueNote: "totalRevenue = SUM(sales_invoices.amount) where payment_status ILIKE 'paid'",
    };
  } finally {
    client.release();
  }
}

export async function getRevenueByMonth() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT SUM(amount) as revenue, TO_CHAR(created_at, 'YYYY-MM') as month
      FROM sales_invoices
      WHERE payment_status ILIKE 'paid' AND created_at >= NOW() - INTERVAL '24 months'
      GROUP BY month
      ORDER BY month
    `);

    return rows.map((r) => ({
      month: r.month,
      revenue: Math.round((parseFloat(r.revenue) || 0) * 100) / 100,
    }));
  } finally {
    client.release();
  }
}
