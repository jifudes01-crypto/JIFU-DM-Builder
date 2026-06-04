create extension if not exists "pgcrypto";

do $$ begin
  create type template_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type template_block_type as enum (
    'text',
    'title',
    'subtitle',
    'body',
    'price',
    'address',
    'feature',
    'image',
    'avatar',
    'contact',
    'qrcode',
    'logo'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type print_option_type as enum ('quantity', 'material_size', 'vendor', 'rush', 'cutting', 'paper', 'size');
exception when duplicate_object then null;
end $$;

alter type print_option_type add value if not exists 'material_size';
alter type print_option_type add value if not exists 'vendor';

do $$ begin
  create type print_status as enum ('pending', 'processing', 'sent', 'completed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type export_format as enum ('png', 'jpg', 'pdf');
exception when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  slug text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  category text not null default '每月精選物件',
  size_label text not null default 'A4 直式',
  width integer not null default 794,
  height integer not null default 1123,
  status template_status not null default 'draft',
  image_url text not null,
  thumbnail_url text,
  notes text,
  duplicated_from uuid references templates(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists template_blocks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references templates(id) on delete cascade,
  type template_block_type not null default 'text',
  label text not null,
  required boolean not null default false,
  max_length integer,
  x numeric(10,2) not null,
  y numeric(10,2) not null,
  width numeric(10,2) not null,
  height numeric(10,2) not null,
  font_size integer not null default 20,
  color text not null default '#0f2a44',
  text_align text not null default 'left' check (text_align in ('left', 'center', 'right')),
  image_fit text not null default 'cover' check (image_fit in ('cover', 'contain')),
  z_index integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  title text,
  mobile text,
  phone text,
  email text,
  line_id text,
  avatar_url text,
  qrcode_url text,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists print_options (
  id uuid primary key default gen_random_uuid(),
  type print_option_type not null,
  label text not null,
  value text not null,
  vendor text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists exports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  template_id uuid not null references templates(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  format export_format not null,
  file_url text not null,
  preview_url text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists print_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  template_id uuid not null references templates(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  export_id uuid references exports(id) on delete set null,
  preview_url text,
  png_url text,
  jpg_url text,
  pdf_url text,
  print_quantity text,
  paper text,
  size text,
  total_quantity integer not null default 0,
  material_summary text,
  vendor text,
  batch_items jsonb not null default '[]'::jsonb,
  is_rush boolean not null default false,
  is_cutting boolean not null default false,
  message text,
  status print_status not null default 'pending',
  internal_note text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_templates_team_status on templates(team_id, status);
create index if not exists idx_template_blocks_template on template_blocks(template_id, z_index);
create index if not exists idx_contacts_team_active on contacts(team_id, is_active);
create index if not exists idx_print_requests_status on print_requests(status, created_at desc);

alter table teams add column if not exists description text;
alter table print_options add column if not exists vendor text;
alter table print_requests add column if not exists total_quantity integer not null default 0;
alter table print_requests add column if not exists material_summary text;
alter table print_requests add column if not exists vendor text;
alter table print_requests add column if not exists batch_items jsonb not null default '[]'::jsonb;

drop trigger if exists teams_set_updated_at on teams;
create trigger teams_set_updated_at before update on teams for each row execute function set_updated_at();

drop trigger if exists templates_set_updated_at on templates;
create trigger templates_set_updated_at before update on templates for each row execute function set_updated_at();

drop trigger if exists template_blocks_set_updated_at on template_blocks;
create trigger template_blocks_set_updated_at before update on template_blocks for each row execute function set_updated_at();

drop trigger if exists contacts_set_updated_at on contacts;
create trigger contacts_set_updated_at before update on contacts for each row execute function set_updated_at();

drop trigger if exists print_options_set_updated_at on print_options;
create trigger print_options_set_updated_at before update on print_options for each row execute function set_updated_at();

drop trigger if exists print_requests_set_updated_at on print_requests;
create trigger print_requests_set_updated_at before update on print_requests for each row execute function set_updated_at();

insert into storage.buckets (id, name, public)
values
  ('template-assets', 'template-assets', true),
  ('contact-assets', 'contact-assets', true),
  ('dm-exports', 'dm-exports', true)
on conflict (id) do update set public = excluded.public;

insert into print_options (type, label, value, vendor, sort_order)
values
  ('quantity', '一般印量', '100', null, 1),
  ('quantity', '一般印量', '300', null, 2),
  ('quantity', '一般印量', '500', null, 3),
  ('material_size', '銅版紙 A4', '銅版紙 A4', null, 1),
  ('material_size', '霧面紙 A4', '霧面紙 A4', null, 2),
  ('vendor', '預設廠商', '預設廠商', '預設廠商', 1),
  ('rush', '急件', 'yes', null, 1),
  ('cutting', '需要裁切', 'yes', null, 1);

alter table teams enable row level security;
alter table templates enable row level security;
alter table template_blocks enable row level security;
alter table contacts enable row level security;
alter table print_options enable row level security;
alter table exports enable row level security;
alter table print_requests enable row level security;

drop policy if exists "public read active teams" on teams;
create policy "public read active teams" on teams for select to anon, authenticated using (true);
drop policy if exists "admins write teams" on teams;
drop policy if exists "public manage teams" on teams;
create policy "public manage teams" on teams for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read published templates" on templates;
create policy "public read published templates" on templates for select to anon, authenticated using (true);
drop policy if exists "admins write templates" on templates;
drop policy if exists "public manage templates" on templates;
create policy "public manage templates" on templates for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read template blocks" on template_blocks;
create policy "public read template blocks" on template_blocks for select to anon, authenticated using (true);
drop policy if exists "admins write template blocks" on template_blocks;
drop policy if exists "public manage template blocks" on template_blocks;
create policy "public manage template blocks" on template_blocks for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read active contacts" on contacts;
create policy "public read active contacts" on contacts for select to anon, authenticated using (true);
drop policy if exists "admins write contacts" on contacts;
drop policy if exists "public manage contacts" on contacts;
create policy "public manage contacts" on contacts for all to anon, authenticated using (true) with check (true);

drop policy if exists "public read active print options" on print_options;
create policy "public read active print options" on print_options for select to anon, authenticated using (true);
drop policy if exists "admins write print options" on print_options;
drop policy if exists "public manage print options" on print_options;
create policy "public manage print options" on print_options for all to anon, authenticated using (true) with check (true);

drop policy if exists "public insert exports" on exports;
create policy "public insert exports" on exports for insert to anon, authenticated with check (true);
drop policy if exists "admins read exports" on exports;
drop policy if exists "public read exports" on exports;
create policy "public read exports" on exports for select to anon, authenticated using (true);

drop policy if exists "public insert print requests" on print_requests;
create policy "public insert print requests" on print_requests for insert to anon, authenticated with check (true);
drop policy if exists "admins read print requests" on print_requests;
drop policy if exists "public read print requests" on print_requests;
create policy "public read print requests" on print_requests for select to anon, authenticated using (true);
drop policy if exists "admins update print requests" on print_requests;
drop policy if exists "public update print requests" on print_requests;
create policy "public update print requests" on print_requests for update to anon, authenticated using (true) with check (true);

drop policy if exists "public read template assets" on storage.objects;
create policy "public read template assets" on storage.objects for select to anon, authenticated using (bucket_id in ('template-assets', 'contact-assets', 'dm-exports'));
drop policy if exists "admins upload template assets" on storage.objects;
drop policy if exists "public upload template assets" on storage.objects;
create policy "public upload template assets" on storage.objects for insert to anon, authenticated with check (bucket_id in ('template-assets', 'contact-assets'));
drop policy if exists "public upload dm exports" on storage.objects;
create policy "public upload dm exports" on storage.objects for insert to anon, authenticated with check (bucket_id = 'dm-exports');
