create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null check (kind in ('guitar', 'strings', 'amp', 'accessory')),
  brand text not null check (btrim(brand) <> ''),
  model text not null check (btrim(model) <> ''),
  spec_source_url text not null check (spec_source_url ~ '^https://[^[:space:]]+$'),
  price_amount_minor bigint check (price_amount_minor > 0),
  currency text check (currency = 'RUB'),
  price_source_url text check (price_source_url ~ '^https://[^[:space:]]+$'),
  price_checked_on date check (isfinite(price_checked_on)),
  is_active boolean not null default false,
  unique (id, kind),
  constraint product_price_metadata check (
    num_nonnulls(price_amount_minor, currency, price_source_url, price_checked_on) in (0, 4)
  ),
  constraint active_product_has_price check (not is_active or price_amount_minor is not null)
);

create table public.guitar_specs (
  product_id uuid primary key,
  product_kind text generated always as ('guitar'::text) stored,
  type text not null check (type in ('classical', 'steel_acoustic', 'electric')),
  orientation text check (orientation in ('right', 'left')),
  string_count smallint not null check (string_count > 0),
  has_pickup boolean,
  body_shape text check (btrim(body_shape) <> ''),
  gauge_label text check (btrim(gauge_label) <> ''),
  tension_label text check (btrim(tension_label) <> ''),
  strings_family text generated always as (
    case when type = 'classical' then 'nylon' else type end
  ) stored,
  supported_amp_type text generated always as (
    case when has_pickup then case when type = 'electric' then 'electric' else 'acoustic' end end
  ) stored,
  foreign key (product_id, product_kind) references public.products (id, kind) on delete cascade
);

create table public.string_specs (
  product_id uuid primary key,
  product_kind text generated always as ('strings'::text) stored,
  family text not null check (family in ('nylon', 'steel_acoustic', 'electric')),
  string_count smallint not null check (string_count > 0),
  gauge_label text check (btrim(gauge_label) <> ''),
  tension_label text check (btrim(tension_label) <> ''),
  check (gauge_label is not null or tension_label is not null),
  foreign key (product_id, product_kind) references public.products (id, kind) on delete cascade
);

create table public.amplifier_specs (
  product_id uuid primary key,
  product_kind text generated always as ('amp'::text) stored,
  amp_type text not null check (amp_type in ('acoustic', 'electric')),
  power_watts numeric check (power_watts > 0 and power_watts < 'Infinity'::numeric),
  input_type text check (btrim(input_type) <> ''),
  foreign key (product_id, product_kind) references public.products (id, kind) on delete cascade
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  storage_path text not null check (btrim(storage_path) <> ''),
  sort_order integer not null default 0 check (sort_order >= 0),
  alt_text text not null check (btrim(alt_text) <> ''),
  author text not null check (btrim(author) <> ''),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
  rights_label text not null check (btrim(rights_label) <> ''),
  rights_url text not null check (rights_url ~ '^https://[^[:space:]]+$'),
  attribution_text text not null check (btrim(attribution_text) <> ''),
  unique (product_id, sort_order)
);

create table public.audio_samples (
  id uuid primary key default gen_random_uuid(),
  guitar_id uuid not null references public.guitar_specs (product_id) on delete cascade,
  title text not null check (btrim(title) <> ''),
  recording_chain text check (btrim(recording_chain) <> ''),
  storage_path text check (btrim(storage_path) <> ''),
  embed_url text check (embed_url ~ '^https://[^[:space:]]+$'),
  author text not null check (btrim(author) <> ''),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
  rights_label text not null check (btrim(rights_label) <> ''),
  rights_url text not null check (rights_url ~ '^https://[^[:space:]]+$'),
  attribution_text text not null check (btrim(attribution_text) <> ''),
  constraint audio_playback_source check (num_nonnulls(storage_path, embed_url) = 1)
);

create index products_catalog_idx on public.products (kind, price_amount_minor, brand, model, slug)
  where is_active;
create index guitar_specs_filters_idx on public.guitar_specs (type, orientation, string_count);
create index string_specs_filters_idx on public.string_specs (family, string_count);
create index amplifier_specs_type_idx on public.amplifier_specs (amp_type);
create index audio_samples_guitar_idx on public.audio_samples (guitar_id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.require_publishable_product()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.is_active then
    return new;
  end if;

  if not exists (select 1 from public.product_images where product_id = new.id)
    or (new.kind = 'guitar' and not exists (
      select 1 from public.guitar_specs where product_id = new.id
    ))
    or (new.kind = 'strings' and not exists (
      select 1 from public.string_specs where product_id = new.id
    ))
    or (new.kind = 'amp' and not exists (
      select 1 from public.amplifier_specs where product_id = new.id
    )) then
    raise exception using errcode = '23514', message = 'Published products require an image and category specifications';
  end if;

  return new;
end;
$$;

create trigger require_publishable_product
before insert or update of is_active, kind, id on public.products
for each row execute function private.require_publishable_product();

-- Unpublish before deleting or transferring category specifications or images.
-- Lock the product so publication cannot race with this change.
create function private.require_unpublished_product()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  published boolean;
begin
  if tg_op = 'UPDATE' and new.product_id = old.product_id then
    return new;
  end if;

  select is_active into published
  from public.products where id = old.product_id for update;

  if published then
    raise exception using errcode = '23514', message = 'Unpublish the product before removing its specifications or images';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger protect_published_guitar_specs
before delete or update of product_id on public.guitar_specs
for each row execute function private.require_unpublished_product();
create trigger protect_published_string_specs
before delete or update of product_id on public.string_specs
for each row execute function private.require_unpublished_product();
create trigger protect_published_amplifier_specs
before delete or update of product_id on public.amplifier_specs
for each row execute function private.require_unpublished_product();
create trigger protect_published_product_images
before delete or update of product_id on public.product_images
for each row execute function private.require_unpublished_product();

revoke all on function private.require_publishable_product(), private.require_unpublished_product()
  from public, anon, authenticated;
