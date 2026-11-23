-- Классические и акустические гитары Yamaha. Цены из карточек или
-- каталогов продавцов на дату проверки. Вариант отделки указан у продавца.
-- Записи остаются черновиками до проверки прав на фотографии.
begin;

insert into public.products (
  slug, kind, brand, model, spec_source_url,
  price_amount_minor, currency, price_source_url, price_checked_on
)
select
  slug, 'guitar', 'Yamaha', model, spec_source_url,
  price_rub * 100, 'RUB', price_source_url, date '2026-11-23'
from (values
  ('yamaha-cg102', 'CG102', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 14900, 'https://www.legato.su/product/klassicheskaya_gitara_yamaha_cg102/'),
  ('yamaha-cg122ms', 'CG122MS', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 29990, 'https://pop-music.ru/catalog/gitaryi/gitaryi-klassicheskie/tags/brand-is-yamaha/'),
  ('yamaha-cg122mc', 'CG122MC', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 29990, 'https://pop-music.ru/catalog/gitaryi/gitaryi-klassicheskie/tags/brand-is-yamaha/'),
  ('yamaha-cg142s', 'CG142S', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 35990, 'https://pop-music.ru/catalog/gitaryi/gitaryi-klassicheskie/tags/brand-is-yamaha/'),
  ('yamaha-cg142c', 'CG142C', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 35990, 'https://muzmsk.ru/catalog/klassicheskie-gitary/gitara-yamaha-cg142c/'),
  ('yamaha-cg162s', 'CG162S', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 59590, 'https://yamaha.ru/product/klassicheskaya-gitara-yamaha-cg162s/'),
  ('yamaha-cg162c', 'CG162C', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 58990, 'https://bravostore.ru/catalog/gitary_i_vse_dlya_gitar/klassicheskie_gitary/6_strunnye_klassicheskie_gitary_neylon/yamaha_cg162c.html'),
  ('yamaha-cg182s', 'CG182S', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 67190, 'https://yamaha.ru/product/gitara-klassicheskaya-yamaha-cg182s/'),
  ('yamaha-cg192s', 'CG192S', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/classical-nylon-guitars/cg-cgx/specs.html', 64661, 'https://shamray.ru/product/yamaha-cg192s'),
  ('yamaha-fg800', 'FG800', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 30990, 'https://pop-music.ru/products/akusticheskaya-gitara-yamaha-fg800-bl-888880022485/'),
  ('yamaha-fg820', 'FG820', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 31990, 'https://pop-music.ru/catalog/gitaryi/akusticheskie-gitary-6-strun/tags/brand-is-yamaha/'),
  ('yamaha-fg820l', 'FG820L', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 51390, 'https://yamaha.ru/product/akusticheskaya-gitara-yamaha-fg820l-natural/'),
  ('yamaha-fg830', 'FG830', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 48950, 'https://pop-music.ru/catalog/gitaryi/akusticheskie-gitary-6-strun/tags/brand-is-yamaha/'),
  ('yamaha-fg850', 'FG850', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 60000, 'https://guitarlavka.ru/gitaryi/akusticheskie-gitaryi/akusticheskaya-gitara-yamaha-fg850'),
  ('yamaha-fs800', 'FS800', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 30900, 'https://pop-music.ru/catalog/gitaryi/akusticheskie-gitary-6-strun/tags/brand-is-yamaha/'),
  ('yamaha-fs820', 'FS820', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 40880, 'https://pop-music.ru/catalog/gitaryi/akusticheskie-gitary-6-strun/tags/brand-is-yamaha/'),
  ('yamaha-fs830', 'FS830', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 44590, 'https://yamaha.ru/catalog/gitary/akusticheskie-gitary/'),
  ('yamaha-fgx800c', 'FGX800C', 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/acoustic-guitars/fg-series/fg-800/specs.html', 43590, 'https://yamaha.ru/product/elektroakusticheskaya-gitara-yamaha-fgx800c-nt/')
) as models(slug, model, spec_source_url, price_rub, price_source_url)
on conflict (slug) do nothing;

insert into public.guitar_specs (
  product_id, type, orientation, string_count, has_pickup, body_shape, tension_label
)
select
  p.id, specs.type, specs.orientation, 6, specs.has_pickup,
  specs.body_shape, specs.tension_label
from (values
  ('yamaha-cg102', 'classical', null, false, 'Классический', 'Среднее'),
  ('yamaha-cg122ms', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg122mc', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg142s', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg142c', 'classical', 'right', false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg162s', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg162c', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg182s', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-cg192s', 'classical', null, false, 'Классический', 'Высокое у верхних струн, среднее у басовых'),
  ('yamaha-fg800', 'steel_acoustic', null, false, 'Дредноут', null),
  ('yamaha-fg820', 'steel_acoustic', null, false, 'Дредноут', null),
  ('yamaha-fg820l', 'steel_acoustic', 'left', false, 'Дредноут', null),
  ('yamaha-fg830', 'steel_acoustic', null, false, 'Дредноут', null),
  ('yamaha-fg850', 'steel_acoustic', null, false, 'Дредноут', null),
  ('yamaha-fs800', 'steel_acoustic', null, false, 'Concert', null),
  ('yamaha-fs820', 'steel_acoustic', null, false, 'Concert', null),
  ('yamaha-fs830', 'steel_acoustic', null, false, 'Concert', null),
  ('yamaha-fgx800c', 'steel_acoustic', null, true, 'Дредноут с вырезом', null)
) as specs(slug, type, orientation, has_pickup, body_shape, tension_label)
join public.products as p on p.slug = specs.slug and p.kind = 'guitar'
on conflict (product_id) do nothing;

-- Дополняем имеющиеся модели Ibanez, сохраняя ранее внесённые цены.
update public.products as p
set price_amount_minor = snapshots.price_rub * 100,
    currency = 'RUB',
    price_source_url = snapshots.price_source_url,
    price_checked_on = date '2026-11-23'
from (values
  ('ibanez-ga3', 20177, 'https://shopotam.ru/product/ibanez-ga3-oam-a86767034'),
  ('ibanez-pf15ece', 31590, 'https://skifmusic.ru/product/59805-elektroakusticheskaya-gitara-ibanez-pf15ece-natural')
) as snapshots(slug, price_rub, price_source_url)
where p.slug = snapshots.slug and p.price_amount_minor is null;

commit;
