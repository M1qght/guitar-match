import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { Action, Status } from '../../shared/ui';
import { fetchProduct } from './catalogApi';
import { FavoriteButton } from '../account/AccountRoutes';
import { formatPrice } from './ProductCard';
import styles from './catalog.module.css';

function Gallery({ images }) {
  const [selected, selectImage] = useState(0);
  const photo = images[selected];

  if (!photo) return <div className={styles.photoPlaceholder}>Фотографий пока нет</div>;

  return <div className={styles.gallery}>
    <figure>
      <img className={styles.detailImage} src={photo.url} alt={photo.altText ?? ''} />
      {(photo.attributionText || photo.author || photo.sourceUrl || photo.rightsUrl) && (
        <figcaption>
          {photo.attributionText || photo.author}
          {photo.sourceUrl && <a href={photo.sourceUrl}>Источник фото</a>}
          {photo.rightsUrl && <a href={photo.rightsUrl}>{photo.rightsLabel || 'Условия использования'}</a>}
        </figcaption>
      )}
    </figure>
    {images.length > 1 && <div className={styles.thumbnails} role="group" aria-label="Фотографии товара">
      {images.map((image, index) => (
        <button key={index} type="button" aria-label={`Показать фото ${index + 1}`}
          aria-pressed={selected === index} onClick={() => selectImage(index)}>
          <img src={image.url} alt="" loading="lazy" />
        </button>
      ))}
    </div>}
  </div>;
}

export default function Product() {
  const { slug } = useParams();
  const { state } = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [response, setResponse] = useState(null);
  const fromFavorites = state?.fromFavorites === true;
  const backTo = { pathname: fromFavorites ? '/favorites' : '/catalog', search: state?.catalogSearch ?? '' };

  useEffect(() => {
    const controller = new AbortController();
    fetchProduct(slug, controller.signal)
      .then((product) => {
        if (!controller.signal.aborted) setResponse({ slug, attempt, product });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResponse({ slug, attempt, error: error.message });
      });
    return () => controller.abort();
  }, [slug, attempt]);

  const result = response?.slug === slug && response.attempt === attempt ? response : null;
  const product = result?.product;
  const price = product && formatPrice(product.priceAmountMinor, product.currency);

  return <>
    <Link className={styles.back} to={backTo}>← {fromFavorites ? 'Избранное' : 'Каталог'}</Link>
    <div className={styles.productContent}>
      {!result && <Status heading="h1" title="Загружаем товар…" />}
      {result?.error && <Status heading="h1" kind="error" title="Не удалось загрузить товар"
        action={<Action onClick={() => setAttempt(attempt + 1)}>Повторить</Action>}>{result.error}</Status>}
      {result && !result.error && !product && <Status heading="h1" title="Товар не найден">
        Проверьте адрес или выберите другой товар в каталоге.
      </Status>}
      {product && <article className={styles.detail}>
        <Gallery key={product.slug} images={product.images} />
        <div className={styles.detailBody}>
          <p className={styles.detailLabel}>{product.categoryLabel}</p>
          <h1>{product.brand} {product.model}</h1>
          {price && <>
            <p className={styles.detailPrice}>{price}</p>
            <p className={styles.metadata}>
              Ориентировочная цена
              {product.priceCheckedOn && <> на <time dateTime={product.priceCheckedOn}>{product.priceCheckedOn.split('-').reverse().join('.')}</time></>}
              {product.priceSourceUrl && <> · <a href={product.priceSourceUrl}>Источник цены</a></>}
            </p>
          </>}
          {product.specs.length > 0 && (
            <dl className={styles.specs}>
              {product.specs.map(({ label, value }) => <Fragment key={label}><dt>{label}</dt><dd>{value}</dd></Fragment>)}
            </dl>
          )}
          {product.specSourceUrl && <p><a href={product.specSourceUrl}>Спецификация производителя</a></p>}
          <div className={styles.actions}><FavoriteButton productId={product.id} /></div>
        </div>
      </article>}
    </div>
  </>;
}
