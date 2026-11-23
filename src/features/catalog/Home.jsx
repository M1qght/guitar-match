import { Link } from 'react-router';
import { Action } from '../../shared/ui';
import { guitarTypes } from './catalogFilters';
import styles from './catalog.module.css';

const typeImages = {
  classical: '/images/classical.jpg',
  steel_acoustic: '/images/acoustic.jpg',
  electric: '/images/electric.jpg',
};

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
        <h2 id="collection">Три типа гитар</h2>
        <Link to="/catalog">Весь каталог <span aria-hidden="true">↗</span></Link>
      </div>
      <div className={styles.grid}>
        {guitarTypes.map(({ id, label }) => (
          <Link key={id} className={styles.card} to={`/catalog?kind=guitar&type=${id}`}>
            <div className={styles.cardMedia}><img src={typeImages[id]} alt="" loading="lazy" /></div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardTitle}>{label}</h3>
              <span className={styles.arrow} aria-hidden="true">↗</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  </>;
}
