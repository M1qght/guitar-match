export const categories = [
  { id: 'guitar', label: 'Гитары' },
  { id: 'strings', label: 'Струны' },
  { id: 'amp', label: 'Усилители' },
  { id: 'accessory', label: 'Аксессуары' },
];

export const guitarTypes = [
  { id: 'classical', label: 'Классическая', strings: 'Нейлоновые струны' },
  { id: 'steel_acoustic', label: 'Акустическая', strings: 'Стальные струны' },
  { id: 'electric', label: 'Электрогитара', strings: 'Магнитные звукосниматели' },
];

export const sortOptions = [
  { id: 'name_asc', label: 'По названию' },
  { id: 'price_asc', label: 'Сначала дешевле' },
  { id: 'price_desc', label: 'Сначала дороже' },
];

const stringCounts = [4, 5, 6, 7, 8, 9, 10, 12].map((count) => ({ id: String(count), label: String(count) }));

export const categoryFilters = {
  guitar: [
    { key: 'type', label: 'Тип гитары', options: guitarTypes },
    { key: 'orientation', label: 'Ориентация', options: [
      { id: 'right', label: 'Праворукая' }, { id: 'left', label: 'Леворукая' },
    ] },
    { key: 'string_count', label: 'Количество струн', options: stringCounts },
    { key: 'has_pickup', label: 'Звукосниматель', options: [
      { id: 'true', label: 'Есть' }, { id: 'false', label: 'Нет' },
    ] },
  ],
  strings: [
    { key: 'family', label: 'Назначение', options: [
      { id: 'nylon', label: 'Классическая гитара' },
      { id: 'steel_acoustic', label: 'Акустическая гитара' },
      { id: 'electric', label: 'Электрогитара' },
    ] },
    { key: 'string_count', label: 'Количество струн', options: stringCounts },
  ],
  amp: [
    { key: 'amp_type', label: 'Тип усилителя', options: [
      { id: 'acoustic', label: 'Акустический' }, { id: 'electric', label: 'Для электрогитары' },
    ] },
  ],
  accessory: [],
};

const filterKeys = new Set(Object.values(categoryFilters).flatMap((fields) => fields.map(({ key }) => key)));

function selectOption(value, options, fallback = '') {
  return options.find(({ id }) => id === value)?.id ?? fallback;
}

export function readCatalogParams(params) {
  const kind = selectOption(params.get('kind'), categories, 'guitar');
  const sort = selectOption(params.get('sort'), sortOptions, 'name_asc');
  const q = (params.get('q') ?? '').trim().slice(0, 120);
  const requestedPage = Number(params.get('page'));
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 10000
    ? requestedPage : 1;
  const filters = {};

  for (const { key, options } of categoryFilters[kind]) {
    const value = selectOption(params.get(key), options);
    if (value) filters[key] = value;
  }
  return { kind, q, sort, page, filters };
}

export function updateCatalogParams(params, updates) {
  const next = new URLSearchParams(params);
  if (Object.hasOwn(updates, 'kind') && updates.kind !== readCatalogParams(params).kind) {
    for (const key of filterKeys) next.delete(key);
  }
  if (Object.keys(updates).some((key) => key !== 'page')) next.delete('page');
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value === '' || (key === 'page' && Number(value) === 1)) next.delete(key);
    else next.set(key, String(value));
  }
  const { kind, q, sort, page, filters } = readCatalogParams(next);
  return new URLSearchParams({
    ...(kind !== 'guitar' && { kind }),
    ...(q && { q }),
    ...(sort !== 'name_asc' && { sort }),
    ...(page > 1 && { page: String(page) }),
    ...filters,
  });
}
