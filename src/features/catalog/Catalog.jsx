import { useSearchParams } from 'react-router';
import { Action, PageHeading, Status } from '../../shared/ui';
import ProductCard from './ProductCard';
import { categories, demoProducts } from './demoProducts';
import styles from './catalog.module.css';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') ?? '';
  const query = params.get('q') ?? '';
  const search = query.trim().toLowerCase();
  const visibleProducts = demoProducts.filter((product) =>
    (!type || product.type === type) && product.model.toLowerCase().includes(search),
  );

  function changeFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === 'q' });
  }

  return <>
    <PageHeading title="Каталог">Демонстрационные модели и иллюстрации для знакомства с интерфейсом.</PageHeading>
    <div className={styles.filters}>
      <label>Название<input type="search" placeholder="Например, Nylon" value={query}
        onChange={(event) => changeFilter('q', event.target.value)} /></label>
      <label>Тип гитары<select value={type} onChange={(event) => changeFilter('type', event.target.value)}>
        <option value="">Все типы</option>
        {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        {type && !categories.some(({ id }) => id === type) && <option value={type}>Неизвестный тип</option>}
      </select></label>
    </div>
    {visibleProducts.length > 0
      ? <div className={styles.grid}>{visibleProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      : <Status title="Гитары не найдены" action={<Action onClick={() => setParams({})}>Сбросить фильтры</Action>}>
        Попробуйте другое название или тип гитары.
      </Status>}
  </>;
}
