import { Link, useLocation } from 'react-router';
import styles from './catalog.module.css';

export function formatPrice(amountMinor, currency) {
  if (amountMinor == null || !currency) return null;
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amountMinor / 100);
}

export default function ProductCard({ product }) {
  const { pathname, search } = useLocation();
  const image = product.images[0];
  const price = formatPrice(product.priceAmountMinor, product.currency);
  return (
    <article>
      <Link className={styles.card} to={`/catalog/${product.slug}`} state={{
        catalogSearch: search,
        fromFavorites: pathname === '/favorites',
      }}>
        <div className={styles.cardMedia}>
          {image
            ? <img src={image.url} alt="" loading="lazy" />
            : <span className={styles.photoPlaceholder}>Нет фото</span>}
        </div>
        <div className={styles.cardBody}>
          <span className={styles.cardCategory}>{product.categoryLabel}</span>
          <h2 className={styles.cardTitle}>{product.brand} {product.model}</h2>
          {price && <p className={styles.price}>{price}</p>}
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </div>
      </Link>
    </article>
  );
}
