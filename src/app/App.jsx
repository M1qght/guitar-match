import { Component, lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router';
import Home from '../features/catalog/Home';
import { Action, PageHeading, Status } from '../shared/ui';
import styles from './App.module.css';

const Catalog = lazy(() => import('../features/catalog/Catalog'));
const Product = lazy(() => import('../features/catalog/Product'));
const Match = lazy(() => import('../features/presets/Match'));
const navigation = [
  ['Каталог', '/catalog'], ['Подобрать', '/presets/new'], ['Опробовать', '/try'], ['Профиль', '/profile'],
];

class PageBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <Status heading="h1" kind="error" title="Страница не загрузилась"
          action={<Action onClick={() => window.location.reload()}>Повторить</Action>}>
          Попробуйте обновить страницу.
        </Status>
      );
    }
    return this.props.children;
  }
}

function getTheme() {
  try {
    const saved = localStorage.getItem('guitarmatch-theme');
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Тема остаётся доступной в текущей вкладке.
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [theme, setTheme] = useState(getTheme);
  const { pathname } = useLocation();
  const dark = theme === 'dark';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('guitarmatch-theme', theme);
    } catch {
      // Браузер может запретить запись в локальное хранилище.
    }
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a className={styles.skip} href="#main-content">К содержимому</a>
      <header className={styles.header}>
        <div className={styles.bar}>
          <Link className={styles.brand} to="/"><span aria-hidden="true">♫</span> GuitarMatch</Link>
          <nav className={styles.nav} aria-label="Основная навигация">
            {navigation.map(([label, to]) => (
              <NavLink key={to} to={to} className={({ isActive }) => isActive ? styles.active : undefined}>{label}</NavLink>
            ))}
          </nav>
          <button className={styles.theme} type="button" onClick={() => setTheme(dark ? 'light' : 'dark')}
            aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}>
            <span aria-hidden="true">{dark ? '☀' : '☾'}</span>
          </button>
        </div>
      </header>
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <PageBoundary key={pathname}>
          <Suspense fallback={<Status heading="h1" title="Загружаем страницу…" />}>
            <Routes>
              <Route index element={<Home />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="catalog/:slug" element={<Product />} />
              <Route path="presets/new" element={<Match />} />
              <Route path="try" element={<TryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Status heading="h1" kind="error" title="Страница не найдена"
                action={<Action to="/">На главную</Action>} />} />
            </Routes>
          </Suspense>
        </PageBoundary>
      </main>
      <footer className={styles.footer}>
        <div className={styles.bar}>
          <Link className={styles.brand} to="/">GuitarMatch</Link>
          <span>Демонстрационная версия</span>
        </div>
      </footer>
    </div>
  );
}

function TryPage() {
  return <>
    <PageHeading title="Опробовать">Здесь будут реальные записи гитар с указанием модели и источника.</PageHeading>
    <Status title="Аудиозаписей пока нет" action={<Action to="/catalog">Смотреть каталог</Action>} />
  </>;
}

function ProfilePage() {
  return <>
    <PageHeading title="Профиль">Здесь будут настройки профиля, избранное и сохранённые наборы.</PageHeading>
    <Status title="Гостевой режим" action={<Action to="/catalog">Смотреть каталог</Action>}>
      Вход появится после подключения аккаунтов.
    </Status>
  </>;
}
