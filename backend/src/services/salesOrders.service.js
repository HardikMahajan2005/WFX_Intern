import { supabase } from "../config/supabase.js";

export async function listSalesOrders({ page, limit, status, buyer_id, sort_by, sort_order }) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales_orders")
    .select(
      `
      *,
      buyers ( company_name, country ),
      finished_goods ( style_name, category, fabric, color )
      `,
      { count: "exact" }
    );

  if (status)   query = query.ilike("status",   `%${status}%`);
  if (buyer_id) query = query.eq("buyer_id",    buyer_id);

  query = query
    .order(sort_by, { ascending: sort_order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], total: count || 0 };
}
