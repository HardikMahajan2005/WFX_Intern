-- ============================================================
-- Grant EXECUTE on execute_readonly_sql to all Supabase roles.
-- Without this, PostgREST cannot introspect the function and
-- throws PGRST002 when supabase.rpc() is called.
-- ============================================================

-- Recreate the function with explicit search_path to avoid
-- any schema resolution issues inside PostgREST.
create or replace function public.execute_readonly_sql(query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    result jsonb;
begin
    -- Guard: only allow SELECT statements
    if query !~* '^\s*select' then
        raise exception 'Only SELECT statements are allowed';
    end if;

    execute format(
        'select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t',
        query
    ) into result;

    return result;
end;
$$;

-- Grant execute to all roles PostgREST uses
grant execute on function public.execute_readonly_sql(text) to anon;
grant execute on function public.execute_readonly_sql(text) to authenticated;
grant execute on function public.execute_readonly_sql(text) to service_role;
