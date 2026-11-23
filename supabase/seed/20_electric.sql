-- Цены по карточкам продавцов на 2026-11-23. Цвета не считаются отдельными моделями.
with pacifica(model, price_rub, price_url, orientation) as (values
  ('PAC012', 31990, 'https://tdm.su/catalog/gitary_/elektrogitary/yamaha/', 'right'),
  ('PAC112J', 34990, 'https://tdm.su/catalog/gitary_/elektrogitary/yamaha/', 'right'),
  ('PAC112JL', 42990, 'https://tdm.su/catalog/gitary_/elektrogitary/yamaha/', 'left'),
  ('PAC112V', 58990, 'https://tdm.su/catalog/gitary_/elektrogitary/yamaha/', 'right'),
  ('PAC112VM', 50990, 'https://tdm.su/catalog/gitary_/elektrogitary/yamaha/', 'right'),
  ('PAC120H', 67990, 'https://www.yamahamusic.ru/shop/CID_80308_seriya_pacifica.html', 'right'),
  ('PAC212VFM', 69990, 'https://www.yamahamusic.ru/shop/CID_80308_seriya_pacifica.html', 'right'),
  ('PAC212VQM', 69990, 'https://www.yamahamusic.ru/shop/CID_80308_seriya_pacifica.html', 'right'),
  ('PAC311H', 79990, 'https://www.yamahamusic.ru/shop/CID_80308_seriya_pacifica.html', 'right')
), added as (
  insert into public.products (slug, kind, brand, model, spec_source_url,
    price_amount_minor, currency, price_source_url, price_checked_on)
  select 'yamaha-' || lower(model), 'guitar', 'Yamaha', model, 'https://usa.yamaha.com/musical-instruments/guitars-basses-amps/products/electric-guitars/pacifica/specs.html',
    price_rub * 100, 'RUB', price_url, date '2026-11-23'
  from pacifica
  on conflict (slug) do nothing
  returning id, model
)
insert into public.guitar_specs (product_id, type, orientation, string_count, has_pickup, gauge_label)
select added.id, 'electric', pacifica.orientation, 6, true, '.009–.042'
from added join pacifica using (model)
on conflict (product_id) do nothing;

update public.products
set price_amount_minor = 2999000, currency = 'RUB',
  price_source_url = 'https://muzlider.ru/catalog/gitary/elektrogitary/4190/',
  price_checked_on = date '2026-11-23'
where slug = 'ibanez-grx70qa'
  and (price_checked_on is null or price_checked_on < date '2026-11-23');
