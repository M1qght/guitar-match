import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Action, PageHeading, Status } from '../../shared/ui';
import { fetchCatalog } from './catalogApi';
import { categories, categoryFilters, readCatalogParams, sortOptions, updateCatalogParams } from './catalogFilters';
import ProductCard from './ProductCard';
import styles from './catalog.module.css';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const query = useMemo(() => readCatalogParams(params), [params]);
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchCatalog(query, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setResponse({ query, attempt, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResponse({ query, attempt, error: error.message });
      });
    return () => controller.abort();
  }, [query, attempt]);

  const result = response?.query === query && response.attempt === attempt ? response : null;
  const filters = categoryFilters[query.kind] ?? [];
  const hasFilters = Boolean(query.q || Object.keys(query.filters).length || query.sort !== 'name_asc');
  const change = (updates) => setParams(updateCatalogParams(params, updates));
  const reset = () => setParams({ kind: query.kind });

  function search(event) {
    event.preventDefault();
    change({ q: new FormData(event.currentTarget).get('q') });
  }

  return <>
    <PageHeading title="Каталог">Гитары, струны, усилители и аксессуары.</PageHeading>
    <form className={styles.search} role="search" onSubmit={search}>
      <label>Бренд или модель
        <input key={query.q} name="q" type="search" defaultValue={query.q} maxLength={120} />
      </label>
      <Action type="submit">Найти</Action>
    </form>
    <div className={styles.filters}>
      <label>Категория
        <select value={query.kind} onChange={(event) => change({ kind: event.target.value })}>
          {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label>Сортировка
        <select value={query.sort} onChange={(event) => change({ sort: event.target.value })}>
          {sortOptions.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        </select>
      </label>
    </div>
    {filters.length > 0 && (
      <fieldset className={styles.filterGroup}>
        <legend>Фильтры категории</legend>
        <div className={styles.filters}>
          {filters.map(({ key, label, options }) => (
            <label key={key}>{label}
              <select value={query.filters[key] ?? ''} onChange={(event) => change({ [key]: event.target.value })}>
                <option value="">Любой вариант</option>
                {options.map(({ id, label: optionLabel }) => <option key={id} value={id}>{optionLabel}</option>)}
              </select>
            </label>
          ))}
        </div>
      </fieldset>
    )}
    {hasFilters && result?.data?.items.length > 0 && (
      <div className={styles.clearFilters}><Action secondary onClick={reset}>Сбросить фильтры</Action></div>
    )}
    <section aria-label="Результаты каталога">
      {!result && <Status title="Загружаем каталог…" />}
      {result?.error && (
        <Status title="Не удалось загрузить каталог" kind="error"
          action={<Action onClick={() => setAttempt(attempt + 1)}>Повторить</Action>}>
          {result.error}
        </Status>
      )}
      {result?.data?.items.length === 0 && (
        <Status title="Товары не найдены"
          action={hasFilters && <Action onClick={reset}>Сбросить фильтры</Action>}>
          {hasFilters ? 'Измените запрос или фильтры.' : 'Попробуйте выбрать другую категорию.'}
        </Status>
      )}
      {result?.data?.items.length > 0 && (
        <div className={styles.grid}>
          {result.data.items.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      )}
    </section>
    {result?.data && (query.page > 1 || result.data.hasNext) && (
      <nav className={styles.pagination} aria-label="Страницы каталога">
        {query.page > 1 && <Action secondary onClick={() => change({ page: query.page - 1 })}>Назад</Action>}
        <span>Страница {query.page}</span>
        {result.data.hasNext && <Action secondary onClick={() => change({ page: query.page + 1 })}>Дальше</Action>}
      </nav>
    )}
  </>;
}
