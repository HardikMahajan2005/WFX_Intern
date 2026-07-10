import { supabase } from "../config/supabase.js";

export async function listSuppliers({ page, limit }) {
  const offset = (page - 1) * limit;
  const { data, error, count } = await supabase
    .from("suppliers")
    .select("*", { count: "exact" })
    .order("company_name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: data || [], total: count || 0 };
}
