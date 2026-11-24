import { getSupabase } from '../../shared/supabase';
import { categories, categoryFilters, guitarTypes } from './catalogFilters';

const PAGE_SIZE = 12;
const PRODUCT_FIELDS = 'id,slug,kind,brand,model,price_amount_minor,currency,is_active';
export const SUMMARY = `${PRODUCT_FIELDS},product_images(storage_path,alt_text)`;
const DETAIL = `${PRODUCT_FIELDS},
  product_images(storage_path,alt_text,source_url,rights_url,attribution_text,author,rights_label),
  spec_source_url,price_source_url,price_checked_on,
  guitar_specs(type,orientation,string_count,has_pickup,body_shape,gauge_label,tension_label),
  string_specs(family,string_count,gauge_label,tension_label),
  amplifier_specs(amp_type,power_watts,input_type)`;

const specsTables = { guitar: 'guitar_specs', strings: 'string_specs', amp: 'amplifier_specs' };
const extraSpecs = {
  body_shape: 'Форма корпуса', gauge_label: 'Калибр', tension_label: 'Натяжение',
  power_watts: 'Мощность', input_type: 'Вход',
};

function formatSpecs(row) {
  const related = row[specsTables[row.kind]];
  const specs = Array.isArray(related) ? related[0] : related;
  if (!specs) return [];

  const fields = [
    ...categoryFilters[row.kind],
    ...Object.entries(extraSpecs).map(([key, label]) => ({ key, label })),
  ];
  return fields.flatMap(({ key, label, options }) => {
    const value = specs[key];
    if (value == null) return [];
    return [{
      label,
      value: options?.find(({ id }) => id === String(value))?.label
        ?? (key === 'power_watts' ? `${value} Вт` : String(value)),
    }];
  });
}

export function toProduct(row, client) {
  const guitar = Array.isArray(row.guitar_specs) ? row.guitar_specs[0] : row.guitar_specs;
  return {
    id: row.id,
    isActive: row.is_active,
    slug: row.slug,
    kind: row.kind,
    brand: row.brand,
    model: row.model,
    categoryLabel: guitarTypes.find(({ id }) => id === guitar?.type)?.label
      ?? categories.find(({ id }) => id === row.kind)?.label,
    priceAmountMinor: row.price_amount_minor,
    currency: row.currency,
    specSourceUrl: row.spec_source_url,
    priceSourceUrl: row.price_source_url,
    priceCheckedOn: row.price_checked_on,
    specs: formatSpecs(row),
    images: row.product_images.map((image) => ({
      url: client.storage.from('catalog-images').getPublicUrl(image.storage_path).data.publicUrl,
      altText: image.alt_text,
      sourceUrl: image.source_url,
      rightsUrl: image.rights_url,
      attributionText: image.attribution_text,
      author: image.author,
      rightsLabel: image.rights_label,
    })),
  };
}

export async function fetchCatalog({ kind, q, sort, page, filters }, signal) {
  const client = getSupabase();
  const filterEntries = Object.entries(filters);
  const specsTable = specsTables[kind];
  const join = filterEntries.length ? '!inner' : '';
  const embed = kind === 'guitar'
    ? `,guitar_specs${join}(type)`
    : join ? `,${specsTable}!inner()` : '';
  let query = client.from('products')
    .select(SUMMARY + embed)
    .eq('is_active', true)
    .eq('kind', kind)
    .order('sort_order', { referencedTable: 'product_images' })
    .limit(1, { referencedTable: 'product_images' });

  // Поисковые слова могут встречаться в любой из двух колонок. Пунктуация
  // синтаксиса PostgREST и LIKE не попадает в выражение из пользовательского ввода.
  const words = q.match(/[\p{L}\p{M}\p{N}.-]+/gu) ?? [];
  if (q && !words.length) return { items: [], hasNext: false };
  for (const word of words) {
    query = query.or(`brand.ilike."%${word}%",model.ilike."%${word}%"`);
  }
  for (const [column, value] of filterEntries) {
    query = query.eq(`${specsTable}.${column}`, value);
  }
  if (sort !== 'name_asc') {
    query = query.order('price_amount_minor', { ascending: sort === 'price_asc', nullsFirst: false });
  }
  const start = (page - 1) * PAGE_SIZE;
  const { data, error } = await query.order('brand').order('model').order('slug')
    .range(start, start + PAGE_SIZE)
    .abortSignal(signal);
  if (error) throw new Error('Не удалось загрузить каталог. Проверьте подключение и повторите попытку.');
  return { items: data.slice(0, PAGE_SIZE).map((row) => toProduct(row, client)), hasNext: data.length > PAGE_SIZE };
}

export async function fetchProduct(slug, signal) {
  const client = getSupabase();
  const { data, error } = await client.from('products')
    .select(DETAIL)
    .eq('slug', slug)
    .eq('is_active', true)
    .order('sort_order', { referencedTable: 'product_images' })
    .abortSignal(signal)
    .maybeSingle();
  if (error) throw new Error('Не удалось загрузить товар. Проверьте подключение и повторите попытку.');
  return data ? toProduct(data, client) : null;
}
