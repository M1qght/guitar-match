import { Link, useParams } from 'react-router';
import { Action, Status } from '../../shared/ui';
import { demoProducts, getCategory } from './demoProducts';
import styles from './catalog.module.css';

export default function Product() {
  const { slug } = useParams();
  const product = demoProducts.find((item) => item.slug === slug);

  if (!product) {
    return <Status heading="h1" kind="error" title="Модель не найдена"
      action={<Action to="/catalog">Вернуться в каталог</Action>} />;
  }
  const category = getCategory(product.type);

  return <>
    <Link className={styles.back} to="/catalog">← Каталог</Link>
    <article className={styles.detail}>
      <img className={styles.detailImage} src={product.image}
        alt={`Сгенерированная иллюстрация: ${category.label.toLowerCase()}`} width="512" height="1024" />
      <div className={styles.detailBody}>
        <p className={styles.detailLabel}>{category.label} · Демо</p>
        <h1>{product.model}</h1>
        <p>Условная модель со сгенерированной иллюстрацией. Проверенных характеристик и цены пока нет.</p>
        <div className={styles.actions}>
          <Action to={`/presets/new?type=${product.type}`}>Подобрать по типу</Action>
          <Action secondary to="/try">Опробовать</Action>
        </div>
      </div>
    </article>
  </>;
}
