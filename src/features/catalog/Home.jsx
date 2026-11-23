import { Link } from 'react-router';
import { Action } from '../../shared/ui';
import { demoProducts } from './demoProducts';
import ProductCard from './ProductCard';
import styles from './catalog.module.css';

export default function Home() {
  return <>
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <h1>Найди свою<br />гитару<span>.</span></h1>
        <p>Начни с типа инструмента, который подходит твоему стилю игры.</p>
        <div className={styles.actions}>
          <Action to="/presets/new">Подобрать гитару <span aria-hidden="true">↗</span></Action>
          <Action to="/catalog" secondary>Каталог</Action>
        </div>
      </div>
      <img className={styles.heroImage} src="/images/hero.jpg" width="1536" height="1024" alt="" fetchPriority="high" />
    </section>
    <section className={styles.collection} aria-labelledby="collection">
      <div className={styles.sectionTitle}>
        <div>
          <h2 id="collection">Три типа гитар</h2>
          <p>Примеры из демонстрационного каталога</p>
        </div>
        <Link to="/catalog">Весь каталог <span aria-hidden="true">↗</span></Link>
      </div>
      <div className={styles.grid}>{demoProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
    </section>
  </>;
}
