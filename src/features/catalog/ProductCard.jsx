import { Link } from 'react-router';
import { getCategory } from './demoProducts';
import styles from './catalog.module.css';

export default function ProductCard({ product }) {
  return (
    <article>
      <Link className={styles.card} to={`/catalog/${product.slug}`}>
        <div className={styles.cardMedia}>
          <img src={product.image} alt="" width="512" height="1024" loading="lazy" />
          <span className={styles.demo}>Демо</span>
        </div>
        <div className={styles.cardBody}>
          <span>{getCategory(product.type).label}</span>
          <h3>{product.model}</h3>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </div>
      </Link>
    </article>
  );
}
