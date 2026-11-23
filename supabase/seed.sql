-- Черновики каталога. Источники подтверждают характеристики, а для
-- публикации ещё нужны проверенные цены и фотографии с правом использования.
insert into public.products (slug, kind, brand, model, spec_source_url)
values
  ('ibanez-ga3', 'guitar', 'Ibanez', 'GA3', 'https://www.ibanez.com/na/products/detail/ga3_5t_02.html'),
  ('ibanez-pf15ece', 'guitar', 'Ibanez', 'PF15ECE', 'https://www.ibanez.com/eu/products/detail/pf15ece_1p_08.html'),
  ('ibanez-grx70qa', 'guitar', 'Ibanez', 'GRX70QA', 'https://www.ibanez.com/usa/products/detail/grx70qa_5y_02.html')
on conflict (slug) do nothing;

insert into public.guitar_specs (product_id, type, string_count, has_pickup, body_shape, gauge_label)
select product.id, spec.type, spec.string_count, spec.has_pickup, spec.body_shape, spec.gauge_label
from (values
  ('ibanez-ga3', 'classical', 6, null, 'Classical', '.0285/.033/.041/.030/.036/.044'),
  ('ibanez-pf15ece', 'steel_acoustic', 6, true, 'Cutaway Dreadnought', '.012/.016/.024/.032/.042/.053'),
  ('ibanez-grx70qa', 'electric', 6, true, null, '.009/.011/.016/.024/.032/.042')
) as spec(slug, type, string_count, has_pickup, body_shape, gauge_label)
join public.products as product on product.slug = spec.slug
on conflict (product_id) do nothing;
