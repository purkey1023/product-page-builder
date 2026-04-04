-- ============================================================
-- 상세페이지 메이커 - Supabase 초기 스키마
-- Supabase Dashboard > SQL Editor에서 실행하세요
-- ============================================================

-- ── 프로젝트 테이블
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  product     jsonb not null default '{}',   -- ProductInfo
  sections    jsonb not null default '[]',   -- Section[]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 인덱스
create index if not exists projects_user_id_idx on projects(user_id);
create index if not exists projects_updated_at_idx on projects(updated_at desc);

-- ── updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- ── Row Level Security (중요: 반드시 활성화)
alter table projects enable row level security;

-- 본인 프로젝트만 조회/생성/수정/삭제
create policy "users can manage own projects"
  on projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Storage Bucket 생성 (public 버킷)
-- Dashboard > Storage에서 수동으로 'product-images' 버킷을 생성하거나 아래 실행
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- ── Storage RLS 정책
create policy "users can upload own images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "users can view all product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
