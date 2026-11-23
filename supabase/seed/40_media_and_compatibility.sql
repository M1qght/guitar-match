-- Ibanez PF15ECE и GRX70QA имеют тот же заводской ряд калибров,
-- что и соответствующие наборы D'Addario. Yamaha отдельно указывает
-- для выбранных Pacifica заводской диапазон .009–.042.
insert into public.guitar_string_pairs (guitar_id, strings_id, source_url)
select g.id, s.id, g.spec_source_url
from public.products g
join public.guitar_specs spec on spec.product_id = g.id
join public.products s on s.slug = case
  when g.slug = 'ibanez-pf15ece' then 'daddario-ej16'
  else 'daddario-exl120'
end
where g.slug in ('ibanez-pf15ece', 'ibanez-grx70qa')
  or (g.brand = 'Yamaha' and spec.type = 'electric' and spec.gauge_label = '.009–.042')
on conflict (guitar_id, strings_id) do nothing;

-- Выходы этих моделей описаны в спецификациях Ibanez. Входы
-- усилителей приведены в их собственных карточках источников.
insert into public.guitar_amp_pairs (guitar_id, amp_id, source_url)
select g.id, a.id, g.spec_source_url
from (values ('ibanez-pf15ece', 'fender-acoustasonic-15'), ('ibanez-grx70qa', 'boss-katana-mini'))
  as match(guitar_slug, amp_slug)
join public.products g on g.slug = match.guitar_slug
join public.products a on a.slug = match.amp_slug
on conflict (guitar_id, amp_id) do nothing;

insert into public.product_images (product_id, storage_path, sort_order, alt_text,
  author, source_url, rights_label, rights_url, attribution_text)
select id, 'yamaha-pac112v.jpg', 0, 'Электрогитара Yamaha Pacifica PAC112V',
  'Sjg', 'https://commons.wikimedia.org/wiki/File:Yamaha_Pac%C3%ADfica_112V.jpg',
  'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/',
  'Yamaha Pacífica 112V.jpg — Sjg, Wikimedia Commons. Уменьшенная копия.'
from public.products where slug = 'yamaha-pac112v'
on conflict (product_id, sort_order) do nothing;

update public.products set is_active = true
where slug = 'yamaha-pac112v' and price_amount_minor is not null
  and exists (
    select 1 from public.product_images
    where product_id = products.id and storage_path = 'yamaha-pac112v.jpg'
  );
