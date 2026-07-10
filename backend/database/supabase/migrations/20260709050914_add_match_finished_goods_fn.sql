-- ============================================================
-- Add match_finished_goods function for image similarity search.
-- Uses pgvector's <=> cosine distance operator.
-- Cosine similarity is calculated as: 1 - (embedding <=> query_embedding)
-- ============================================================

create or replace function public.match_finished_goods (
  query_embedding vector(512),
  match_count int
)
returns table (
  style_number text,
  style_name text,
  category text,
  fabric text,
  gsm integer,
  color text,
  print text,
  season text,
  brand text,
  supplier_id text,
  cost numeric(10,2),
  selling_price numeric(10,2),
  image_url text,
  created_at timestamptz,
  similarity_score double precision
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    fg.style_number,
    fg.style_name,
    fg.category,
    fg.fabric,
    fg.gsm,
    fg.color,
    fg.print,
    fg.season,
    fg.brand,
    fg.supplier_id,
    fg.cost,
    fg.selling_price,
    fg.image_url,
    fg.created_at,
    (1 - (fg.embedding <=> query_embedding))::double precision as similarity_score
  from finished_goods fg
  where fg.embedding is not null
  order by fg.embedding <=> query_embedding
  limit match_count;
end;
$$;
