insert into public.products (slug, kind, brand, model, spec_source_url,
  price_amount_minor, currency, price_source_url, price_checked_on)
values
  ('daddario-ej45', 'strings', 'D''Addario', 'EJ45',
    'https://www.daddario.com/collections/subscribe-save-guitar/products/ej45-pro-arte-nylon-classical-guitar-strings-normal-tension',
    199900, 'RUB', 'https://shamray.ru/product/daddario-ej-45', date '2026-11-23'),
  ('daddario-ej16', 'strings', 'D''Addario', 'EJ16',
    'https://www.daddario.com/en-gb/collections/guitar-strings/products/ej16-phosphor-bronze-acoustic-guitar-strings-light-12-53',
    89000, 'RUB', 'https://pop-music.ru/products/strunyi-daddario-ej16-1001000016/', date '2026-11-23'),
  ('daddario-exl120', 'strings', 'D''Addario', 'EXL120',
    'https://www.daddario.com/products/exl120-xl-nickel-wound-electric-guitar-strings-super-light-09-42',
    73000, 'RUB', 'https://shamray.ru/product/daddario-exl120', date '2026-11-23'),
  ('boss-katana-mini', 'amp', 'BOSS', 'KATANA-MINI',
    'https://www.boss.info/us/products/katana-mini/',
    1850000, 'RUB', 'https://muzikroom.ru/shop/usilenie/dlya-elektrogitar/boss-katana-mini-kombousilitel/', date '2026-11-23'),
  ('fender-acoustasonic-15', 'amp', 'Fender', 'Acoustasonic 15',
    'https://www.fender.com/products/acoustasonic-15',
    2409000, 'RUB', 'https://fender-russia.ru/catalog/11-usiliteli/11-1-gitarnye-usiliteli/11-1-1-acoustic/fender-acoustasonic-15-combo/', date '2026-11-23')
on conflict (slug) do nothing;

insert into public.string_specs (product_id, family, string_count, gauge_label, tension_label)
select p.id, s.family, 6, s.gauge_label, s.tension_label
from (values
  ('daddario-ej45', 'nylon', null, 'Normal'),
  ('daddario-ej16', 'steel_acoustic', '.012–.053', null),
  ('daddario-exl120', 'electric', '.009–.042', null)
) as s(slug, family, gauge_label, tension_label)
join public.products p on p.slug = s.slug
on conflict (product_id) do nothing;

insert into public.amplifier_specs (product_id, amp_type, power_watts, input_type)
select p.id, a.amp_type, a.power_watts, 'Инструментальный 6,35 мм'
from (values ('boss-katana-mini', 'electric', 7), ('fender-acoustasonic-15', 'acoustic', 15))
  as a(slug, amp_type, power_watts)
join public.products p on p.slug = a.slug
on conflict (product_id) do nothing;
