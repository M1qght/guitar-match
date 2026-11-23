create table public.guitar_string_pairs (
  guitar_id uuid not null references public.guitar_specs (product_id),
  strings_id uuid not null references public.string_specs (product_id),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
  is_active boolean not null default true,
  primary key (guitar_id, strings_id)
);

create table public.guitar_amp_pairs (
  guitar_id uuid not null references public.guitar_specs (product_id),
  amp_id uuid not null references public.amplifier_specs (product_id),
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
  is_active boolean not null default true,
  primary key (guitar_id, amp_id)
);

create table public.favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id),
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table public.presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  guitar_id uuid not null,
  strings_id uuid not null,
  amp_id uuid,
  created_at timestamptz not null default now(),
  foreign key (guitar_id, strings_id) references public.guitar_string_pairs (guitar_id, strings_id),
  foreign key (guitar_id, amp_id) references public.guitar_amp_pairs (guitar_id, amp_id)
);

create index guitar_string_pairs_strings_idx on public.guitar_string_pairs (strings_id);
create index guitar_amp_pairs_amp_idx on public.guitar_amp_pairs (amp_id);
create index favorites_product_idx on public.favorites (product_id);
create index presets_user_idx on public.presets (user_id, created_at desc);
create index presets_string_pair_idx on public.presets (guitar_id, strings_id);
create index presets_amp_pair_idx on public.presets (guitar_id, amp_id) where amp_id is not null;

-- An explicit, sourced pair also accounts for the supported gauge, tension or input.
-- These checks enforce the basic specifications even after an editor changes a product.
create function private.check_string_specs(guitar uuid, strings uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform 1
  from public.guitar_specs as g
  join public.string_specs as s on s.family = g.strings_family and s.string_count = g.string_count
  where g.product_id = guitar and s.product_id = strings
  for share of g, s;
  return found;
end;
$$;

create function private.check_amplifier_specs(guitar uuid, amp uuid)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  perform 1
  from public.guitar_specs as g
  join public.amplifier_specs as a on a.amp_type = g.supported_amp_type
  where g.product_id = guitar and a.product_id = amp
  for share of g, a;
  return found;
end;
$$;

create function private.require_compatible_pair()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_active then
    if tg_table_name = 'guitar_string_pairs' then
      if not private.check_string_specs(new.guitar_id, new.strings_id) then
        raise exception using errcode = '23514', message = 'Guitar and strings specifications do not match';
      end if;
    elsif not private.check_amplifier_specs(new.guitar_id, new.amp_id) then
      raise exception using errcode = '23514', message = 'Guitar and amplifier specifications do not match';
    end if;
  end if;
  return new;
end;
$$;

create trigger require_compatible_strings
before insert or update on public.guitar_string_pairs
for each row execute function private.require_compatible_pair();
create trigger require_compatible_amplifier
before insert or update on public.guitar_amp_pairs
for each row execute function private.require_compatible_pair();

-- Keep the evidence on active pairs tied to the specifications it was checked against.
create function private.require_pair_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  has_active_pair boolean;
begin
  if tg_table_name = 'guitar_specs' then
    has_active_pair := (
      (new.type, new.orientation, new.string_count, new.gauge_label, new.tension_label)
        is distinct from (old.type, old.orientation, old.string_count, old.gauge_label, old.tension_label)
      and exists (
        select 1 from public.guitar_string_pairs where guitar_id = old.product_id and is_active
      )
    ) or (
      (new.type, new.has_pickup) is distinct from (old.type, old.has_pickup)
      and exists (
        select 1 from public.guitar_amp_pairs where guitar_id = old.product_id and is_active
      )
    );
  elsif tg_table_name = 'string_specs' then
    has_active_pair := (
      (new.family, new.string_count, new.gauge_label, new.tension_label)
        is distinct from (old.family, old.string_count, old.gauge_label, old.tension_label)
      and exists (
        select 1 from public.guitar_string_pairs where strings_id = old.product_id and is_active
      )
    );
  else
    has_active_pair := (
      (new.amp_type, new.input_type) is distinct from (old.amp_type, old.input_type)
      and exists (
        select 1 from public.guitar_amp_pairs where amp_id = old.product_id and is_active
      )
    );
  end if;

  if has_active_pair then
    raise exception using errcode = '23514', message = 'Deactivate and review affected pairs before changing compatibility specifications';
  end if;
  return new;
end;
$$;

create trigger review_pairs_on_guitar_change
before update on public.guitar_specs
for each row execute function private.require_pair_review();
create trigger review_pairs_on_strings_change
before update on public.string_specs
for each row execute function private.require_pair_review();
create trigger review_pairs_on_amplifier_change
before update on public.amplifier_specs
for each row execute function private.require_pair_review();

create function private.require_favorite_product()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.products where id = new.product_id and is_active for share;
  if not found then
    raise exception using errcode = '23514', message = 'Favorites require available products';
  end if;
  return new;
end;
$$;

create trigger require_favorite_product
before insert on public.favorites
for each row execute function private.require_favorite_product();

create function private.require_valid_preset()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  available_products integer;
  selected_guitar_type text;
begin
  -- Allow renaming stored presets even when a component has been retired.
  if tg_op = 'UPDATE' and (new.guitar_id, new.strings_id, new.amp_id)
      is not distinct from (old.guitar_id, old.strings_id, old.amp_id) then
    return new;
  end if;

  perform 1 from public.products
  where id in (new.guitar_id, new.strings_id, new.amp_id) and is_active
  order by id for share;
  get diagnostics available_products = row_count;
  if available_products <> num_nonnulls(new.guitar_id, new.strings_id, new.amp_id) then
    raise exception using errcode = '23514', message = 'Preset requires available products';
  end if;

  perform 1 from public.guitar_string_pairs
  where guitar_id = new.guitar_id and strings_id = new.strings_id and is_active
  for share;
  if not found or not private.check_string_specs(new.guitar_id, new.strings_id) then
    raise exception using errcode = '23514', message = 'Preset requires compatible strings';
  end if;

  select type into selected_guitar_type from public.guitar_specs where product_id = new.guitar_id;
  if new.amp_id is null and selected_guitar_type = 'electric' then
    raise exception using errcode = '23514', message = 'Electric guitar presets require an amplifier';
  end if;

  if new.amp_id is not null then
    perform 1 from public.guitar_amp_pairs
    where guitar_id = new.guitar_id and amp_id = new.amp_id and is_active
    for share;
    if not found or not private.check_amplifier_specs(new.guitar_id, new.amp_id) then
      raise exception using errcode = '23514', message = 'Preset requires a compatible amplifier';
    end if;
  end if;
  return new;
end;
$$;

create trigger require_valid_preset
before insert or update of guitar_id, strings_id, amp_id on public.presets
for each row execute function private.require_valid_preset();

revoke all on function private.check_string_specs(uuid, uuid), private.check_amplifier_specs(uuid, uuid),
  private.require_compatible_pair(), private.require_pair_review(), private.require_favorite_product(),
  private.require_valid_preset() from public, anon, authenticated;

alter table public.products enable row level security;
alter table public.guitar_specs enable row level security;
alter table public.string_specs enable row level security;
alter table public.amplifier_specs enable row level security;
alter table public.product_images enable row level security;
alter table public.audio_samples enable row level security;
alter table public.guitar_string_pairs enable row level security;
alter table public.guitar_amp_pairs enable row level security;
alter table public.favorites enable row level security;
alter table public.presets enable row level security;

revoke all on public.products, public.guitar_specs, public.string_specs, public.amplifier_specs,
  public.product_images, public.audio_samples, public.guitar_string_pairs, public.guitar_amp_pairs,
  public.favorites, public.presets from public, anon, authenticated;
grant select on public.products, public.guitar_specs, public.string_specs, public.amplifier_specs,
  public.product_images, public.audio_samples, public.guitar_string_pairs, public.guitar_amp_pairs
  to anon, authenticated;
grant select, delete on public.favorites, public.presets to authenticated;
grant insert (user_id, product_id) on public.favorites to authenticated;
grant insert (user_id, name, guitar_id, strings_id, amp_id) on public.presets to authenticated;
grant update (name, guitar_id, strings_id, amp_id) on public.presets to authenticated;
grant all on public.products, public.guitar_specs, public.string_specs, public.amplifier_specs,
  public.product_images, public.audio_samples, public.guitar_string_pairs, public.guitar_amp_pairs,
  public.favorites, public.presets to service_role;

create policy select_published_products on public.products
for select to anon, authenticated using (is_active);

create policy select_saved_products on public.products
for select to authenticated using (
  exists (select 1 from public.favorites as f where f.user_id = (select auth.uid()) and f.product_id = products.id)
  or exists (
    select 1 from public.presets as p where p.user_id = (select auth.uid())
      and products.id in (p.guitar_id, p.strings_id, p.amp_id)
  )
);

create policy select_published_guitar_specs on public.guitar_specs
for select to anon, authenticated using (
  exists (select 1 from public.products where id = product_id and is_active)
);
create policy select_published_string_specs on public.string_specs
for select to anon, authenticated using (
  exists (select 1 from public.products where id = product_id and is_active)
);
create policy select_published_amplifier_specs on public.amplifier_specs
for select to anon, authenticated using (
  exists (select 1 from public.products where id = product_id and is_active)
);
create policy select_published_images on public.product_images
for select to anon, authenticated using (
  exists (select 1 from public.products where id = product_id and is_active)
);
create policy select_published_audio on public.audio_samples
for select to anon, authenticated using (
  exists (select 1 from public.products where id = guitar_id and is_active)
);

create policy select_available_string_pairs on public.guitar_string_pairs
for select to anon, authenticated using (
  is_active and exists (
    select 1 from public.guitar_specs as g
    join public.string_specs as s on s.family = g.strings_family and s.string_count = g.string_count
    where g.product_id = guitar_string_pairs.guitar_id and s.product_id = guitar_string_pairs.strings_id
  )
);
create policy select_available_amp_pairs on public.guitar_amp_pairs
for select to anon, authenticated using (
  is_active and exists (
    select 1 from public.guitar_specs as g
    join public.amplifier_specs as a on a.amp_type = g.supported_amp_type
    where g.product_id = guitar_amp_pairs.guitar_id and a.product_id = guitar_amp_pairs.amp_id
  )
);

create policy select_own_favorites on public.favorites
for select to authenticated using (user_id = (select auth.uid()));
create policy insert_own_favorites on public.favorites
for insert to authenticated with check (user_id = (select auth.uid()));
create policy delete_own_favorites on public.favorites
for delete to authenticated using (user_id = (select auth.uid()));

create policy manage_own_presets on public.presets
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
