import { useSearchParams } from 'react-router';
import { Action, PageHeading } from '../../shared/ui';
import { guitarTypes as categories } from '../catalog/catalogFilters';
import styles from '../catalog/catalog.module.css';

export default function Match() {
  const [params, setParams] = useSearchParams();
  const type = params.get('type');
  const selected = categories.find((category) => category.id === type);

  return <>
    <PageHeading title="Подобрать гитару">Выберите тип инструмента, чтобы посмотреть примеры в каталоге.</PageHeading>
    <fieldset className={styles.choices}>
      <legend>Тип гитары</legend>
      {categories.map(({ id, label, strings }) => (
        <label className={styles.choice} key={id}>
          <input type="radio" name="type" checked={type === id} onChange={() => setParams({ type: id }, { replace: true })} />
          <span><strong>{label}</strong><small>{strings}</small></span>
        </label>
      ))}
    </fieldset>
    <div className={styles.actions}>
      {selected
        ? <Action to={`/catalog?type=${selected.id}`}>Показать примеры</Action>
        : <Action to="/catalog" secondary>Смотреть все типы</Action>}
    </div>
  </>;
}
