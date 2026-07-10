import { supabase } from "../config/supabase.js";

export async function listSalesInvoices({
  page, limit, payment_status, currency, sort_by, sort_order,
}) {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("sales_invoices")
    .select(
      `
      *,
      sales_orders ( order_number, quantity, shipment_date, status )
      `,
      { count: "exact" }
    );

  if (payment_status) query = query.ilike("payment_status", `%${payment_status}%`);
  if (currency)       query = query.ilike("currency",       `%${currency}%`);

  query = query
    .order(sort_by, { ascending: sort_order === "asc" })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data || [], total: count || 0 };
}
