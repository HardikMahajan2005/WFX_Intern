-- ============================================================
-- WFX AI-Native ERP — Database Schema
-- Uses natural business keys from source CSVs as primary keys
-- (e.g. SUP-001, BUY-001, WFX-2501, SO-00001) instead of surrogate
-- UUIDs, since the source data already relates records this way.
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists vector; -- pgvector, for future image embeddings

-- ============================================================
-- SUPPLIERS
-- ============================================================
create table if not exists suppliers (
    supplier_id     text primary key,          -- e.g. SUP-001
    company_name    text not null,
    country         text,
    contact         text,
    lead_time_days  integer,
    rating          numeric(2,1),
    created_at      timestamptz default now()
);

create index if not exists idx_suppliers_country on suppliers(country);

-- ============================================================
-- BUYERS
-- ============================================================
create table if not exists buyers (
    buyer_id        text primary key,          -- e.g. BUY-001
    company_name    text not null,
    country         text,
    buyer_category  text,
    created_at      timestamptz default now()
);

create index if not exists idx_buyers_country  on buyers(country);
create index if not exists idx_buyers_category on buyers(buyer_category);

-- ============================================================
-- FINISHED GOODS
-- ============================================================
create table if not exists finished_goods (
    style_number    text primary key,          -- e.g. WFX-2501
    style_name      text not null,
    category        text,
    fabric          text,
    gsm             integer,
    color           text,
    print           text,
    season          text,
    brand           text,
    supplier_id     text references suppliers(supplier_id),
    cost            numeric(10,2),
    selling_price   numeric(10,2),
    image_url       text,
    embedding       vector(512),               -- reserved for CLIP image embeddings
    created_at      timestamptz default now()
);

create index if not exists idx_fg_category  on finished_goods(category);
create index if not exists idx_fg_fabric    on finished_goods(fabric);
create index if not exists idx_fg_gsm       on finished_goods(gsm);
create index if not exists idx_fg_color     on finished_goods(color);
create index if not exists idx_fg_print     on finished_goods(print);
create index if not exists idx_fg_season    on finished_goods(season);
create index if not exists idx_fg_supplier  on finished_goods(supplier_id);
create index if not exists idx_fg_brand     on finished_goods(brand);

-- ============================================================
-- SALES ORDERS
-- ============================================================
create table if not exists sales_orders (
    order_number    text primary key,          -- e.g. SO-00001
    buyer_id        text references buyers(buyer_id),
    style_number    text references finished_goods(style_number),
    quantity        integer,
    unit_price      numeric(10,2),
    shipment_date   date,
    status          text,
    created_at      timestamptz default now()
);

create index if not exists idx_so_buyer         on sales_orders(buyer_id);
create index if not exists idx_so_style         on sales_orders(style_number);
create index if not exists idx_so_status        on sales_orders(status);
create index if not exists idx_so_shipment_date on sales_orders(shipment_date);

-- ============================================================
-- TECH PACKS
-- ============================================================
create table if not exists tech_packs (
    tech_pack_id      text primary key,        -- e.g. TP-WFX-2501
    style_number      text references finished_goods(style_number),
    fabric_details    text,
    construction      text,
    wash_instructions text,
    created_at        timestamptz default now()
);

create index if not exists idx_tp_style on tech_packs(style_number);

-- ============================================================
-- SALES INVOICES
-- ============================================================
create table if not exists sales_invoices (
    invoice_number  text primary key,          -- e.g. INV-00001
    order_number    text references sales_orders(order_number),
    amount          numeric(12,2),
    currency        text,
    payment_status  text,
    created_at      timestamptz default now()
);

create index if not exists idx_si_order    on sales_invoices(order_number);
create index if not exists idx_si_status   on sales_invoices(payment_status);
create index if not exists idx_si_currency on sales_invoices(currency);

-- ============================================================
-- QUERY LOGS (for NL2SQL debugging / future confidence scoring)
-- ============================================================
create table if not exists query_logs (
    id              uuid primary key default gen_random_uuid(),
    question        text,
    generated_sql   text,
    success         boolean,
    error_message   text,
    created_at      timestamptz default now()
);

-- ============================================================
-- HELPER FUNCTION for NL2SQL module: safely execute a read-only
-- SELECT statement and return rows as JSON.
-- ============================================================
create or replace function execute_readonly_sql(query text)
returns jsonb
language plpgsql
security definer
as $$
declare
    result jsonb;
begin
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
