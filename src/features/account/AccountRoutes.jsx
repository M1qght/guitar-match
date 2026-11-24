import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router';
import { Action, PageHeading, Status } from '../../shared/ui';
import { categories } from '../catalog/catalogFilters';
import ProductCard from '../catalog/ProductCard';
import { useAuth } from './authContext';
import { fetchFavorite, fetchFavorites, setFavorite } from './favoritesApi';
import styles from './favorites.module.css';

export function RequireAccount() {
  const { session, status, error, recovery } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'loading') return <Status heading="h1" title="Проверяем сессию…" />;
  if (status === 'error') return <Status heading="h1" kind="error" title="Авторизация недоступна">{error}</Status>;
  if (recovery) return <Navigate replace to="/reset-password" />;
  return session ? <Outlet /> : <Navigate replace to="/login" state={{ from: pathname + search }} />;
}

export function ProfilePage() {
  const { session, signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  async function leave() {
    setPending(true);
    setError(null);
    try { await signOut(); }
    catch (failure) { setError(failure.message); }
    finally { setPending(false); }
  }
  return <>
    <PageHeading title="Профиль">{session.user.email}</PageHeading>
    <div className={styles.actions}>
      <Action to="/favorites">Избранное</Action>
      <Action secondary onClick={leave} disabled={pending}>{pending ? 'Выходим…' : 'Выйти'}</Action>
    </div>
    {error && <p role="alert">{error}</p>}
  </>;
}

export function FavoriteButton({ productId }) {
  const { session, status, recovery } = useAuth();
  const { pathname, search } = useLocation();
  if (status === 'loading') return <Action secondary disabled>Проверяем сессию…</Action>;
  if (status === 'error') return <Action secondary disabled>Избранное недоступно</Action>;
  if (recovery) return <Action secondary to="/reset-password">Завершить восстановление</Action>;
  if (!session) return <Action secondary to="/login" state={{ from: pathname + search }}>Войти, чтобы сохранить</Action>;
  return <FavoriteToggle key={session.user.id + productId} userId={session.user.id} productId={productId} />;
}

function FavoriteToggle({ userId, productId }) {
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, retry] = useState(0);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    const request = new AbortController();
    fetchFavorite(userId, productId, request.signal)
      .then((value) => { if (!request.signal.aborted) setSaved(value); })
      .catch((failure) => { if (!request.signal.aborted) setError(failure.message); });
    return () => request.abort();
  }, [userId, productId, attempt]);

  async function toggle() {
    setError(null);
    if (saved === null) {
      retry((value) => value + 1);
      return;
    }
    setPending(true);
    try {
      await setFavorite(userId, productId, !saved);
      setSaved(!saved);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(false);
    }
  }
  const label = saved ? 'Удалить из избранного' : 'В избранное';
  return <div>
    <Action secondary onClick={toggle} disabled={pending || (saved === null && !error)}>
      {pending || (saved === null && !error) ? 'Избранное…' : saved === null ? 'Повторить' : label}
    </Action>
    {error && <p role="alert">{error}</p>}
  </div>;
}

export function FavoritesPage() {
  const { session } = useAuth();
  const [params, setParams] = useSearchParams();
  const kind = categories.find(({ id }) => id === params.get('kind'))?.id ?? '';
  return <>
    <PageHeading title="Избранное">Сохранённые гитары и оборудование.</PageHeading>
    <label className={styles.filter}>Категория
      <select value={kind} onChange={(event) => setParams(event.target.value ? { kind: event.target.value } : {})}>
        <option value="">Все товары</option>
        {categories.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select>
    </label>
    <FavoritesList key={session.user.id + kind} userId={session.user.id} kind={kind} />
  </>;
}

function FavoritesList({ userId, kind }) {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const request = new AbortController();
    fetchFavorites(userId, kind, request.signal)
      .then((data) => { if (!request.signal.aborted) setItems(data); })
      .catch((failure) => { if (!request.signal.aborted) setError(failure.message); });
    return () => request.abort();
  }, [userId, kind, attempt]);

  async function remove(id) {
    setError(null);
    setPending(id);
    try {
      await setFavorite(userId, id, false);
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (failure) {
      setError(failure.message);
    } finally {
      setPending(null);
    }
  }
  if (!items) return error
    ? <Status title={error} kind="error" action={<Action onClick={() => { setError(null); retry((n) => n + 1); }}>Повторить</Action>} />
    : <Status title="Загружаем избранное…" />;
  if (!items.length) return <Status title={kind ? 'В этой категории ничего нет' : 'Избранное пока пусто'}
    action={<Action secondary to="/catalog">В каталог</Action>} />;
  return <>
    {error && <p role="alert">{error}</p>}
    <ul className={styles.list}>
      {items.map((item) => <li key={item.id}>
        {item.isActive ? <ProductCard product={item} /> : <Status title={`${item.brand} ${item.model}`}>Товар снят с витрины.</Status>}
        <Action secondary disabled={pending !== null} onClick={() => remove(item.id)}>
          {pending === item.id ? 'Удаляем…' : 'Удалить из избранного'}
        </Action>
      </li>)}
    </ul>
  </>;
}
