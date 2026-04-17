-- TestLab · initial schema
-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "vector" with schema extensions;

-- ──────────────────────────────────────────────────────────────────────────────
-- Items (authored test items)
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  title text not null default 'Nová úloha',
  type text not null default 'vyber-z-moznosti',
  question text not null default '',
  options jsonb not null default '[]'::jsonb,
  solution text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'koncept',
  last_validation jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists items_owner_idx on public.items(owner_id);
create index if not exists items_updated_at_idx on public.items(updated_at desc);

-- ──────────────────────────────────────────────────────────────────────────────
-- Knowledge documents
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  size integer not null default 0,
  content text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists documents_owner_idx on public.documents(owner_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- Document chunks with vector embeddings (pgvector)
-- Dimensions match OpenAI text-embedding-3-small (1536).
-- ──────────────────────────────────────────────────────────────────────────────
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  owner_id uuid references auth.users(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists document_chunks_document_idx on public.document_chunks(document_id);
create index if not exists document_chunks_owner_idx on public.document_chunks(owner_id);

-- IVFFlat index for cosine similarity search
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- ──────────────────────────────────────────────────────────────────────────────
-- RPC: match_document_chunks
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
  match_count int default 5,
  p_owner_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  document_name text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    d.name as document_name,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.document_chunks c
  join public.documents d on d.id = c.document_id
  where (p_owner_id is null or c.owner_id = p_owner_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────────────────────────────────────────
alter table public.items enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

create policy "items_owner_all" on public.items
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "documents_owner_all" on public.documents
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "document_chunks_owner_select" on public.document_chunks
  for select using (auth.uid() = owner_id);
create policy "document_chunks_owner_modify" on public.document_chunks
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ──────────────────────────────────────────────────────────────────────────────
-- updated_at trigger for items
-- ──────────────────────────────────────────────────────────────────────────────
create or replace function public.tg_touch_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists items_touch_updated_at on public.items;
create trigger items_touch_updated_at
  before update on public.items
  for each row execute function public.tg_touch_updated_at();
