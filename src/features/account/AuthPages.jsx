import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Action, PageHeading, Status } from '../../shared/ui';
import { useAuth } from './authContext.js';
import styles from './account.module.css';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const RESEND_WAIT = 60_000;

function returnPath(from) {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//') || /[\\\s\u0000-\u001f\u007f]/.test(from)) {
    return '/profile';
  }
  const target = new URL(from, window.location.origin);
  const authPath = target.pathname.replace(/\/+$/, '').toLowerCase();
  if (target.origin !== window.location.origin || target.pathname.startsWith('//') || AUTH_PATHS.includes(authPath)) {
    return '/profile';
  }
  return target.pathname + target.search;
}

function AuthFrame({ title, description, children, links }) {
  return (
    <div className={styles.page}>
      <PageHeading title={title}>{description}</PageHeading>
      {children}
      {links && <div className={styles.links}>{links}</div>}
    </div>
  );
}

function AuthUnavailable({ auth }) {
  if (auth.status === 'loading') return <Status title="Проверяем сеанс…" heading="h1" />;
  return (
    <Status title="Вход сейчас недоступен" heading="h1" kind="error" action={<Action to="/catalog">В каталог</Action>}>
      {auth.error}
    </Status>
  );
}

function AuthForm({ submit, label, disabled = false, children }) {
  const inFlight = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current || disabled) return;
    const values = new FormData(event.currentTarget);
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await submit(values);
    } catch (failure) {
      setError(failure.message);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <fieldset disabled={pending}>
        {children}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <Action type="submit" disabled={disabled}>{pending ? 'Подождите…' : label}</Action>
      </fieldset>
    </form>
  );
}

function EmailField({ autoComplete = 'email' }) {
  return (
    <label>Электронная почта
      <input name="email" type="email" autoComplete={autoComplete} required />
    </label>
  );
}

function PasswordField({ name = 'password', label = 'Пароль', fresh = false }) {
  return (
    <label>{label}
      <input name={name} type="password" autoComplete={fresh ? 'new-password' : 'current-password'}
        minLength={fresh ? 8 : undefined} required />
    </label>
  );
}

function checkedPassword(values) {
  const password = values.get('password');
  if (password !== values.get('confirmation')) throw new Error('Пароли должны совпадать.');
  return password;
}

export function LoginPage() {
  const auth = useAuth();
  const { state } = useLocation();
  if (auth.status !== 'ready') return <AuthUnavailable auth={auth} />;
  if (auth.recovery) return <Navigate to="/reset-password" replace />;
  if (auth.session) return <Navigate to={returnPath(state?.from)} replace />;

  return (
    <AuthFrame title="Вход"
      links={<><Link to="/register" state={state}>Создать аккаунт</Link><Link to="/forgot-password">Забыли пароль?</Link></>}>
      <AuthForm label="Войти" submit={(values) => auth.signIn(values.get('email').trim(), values.get('password'))}>
        <EmailField autoComplete="username" />
        <PasswordField />
      </AuthForm>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const auth = useAuth();
  const { state } = useLocation();
  const [sent, setSent] = useState(false);
  if (auth.status !== 'ready') return <AuthUnavailable auth={auth} />;
  if (auth.recovery) return <Navigate to="/reset-password" replace />;
  if (auth.session) return <Navigate to={returnPath(state?.from)} replace />;

  async function register(values) {
    const hasSession = await auth.signUp(values.get('email').trim(), checkedPassword(values));
    if (!hasSession) setSent(true);
  }

  return (
    <AuthFrame title="Регистрация" links={<Link to="/login" state={state}>Уже есть аккаунт</Link>}>
      {sent
        ? <Status title="Проверьте почту">Откройте ссылку подтверждения из письма в этом же браузере.</Status>
        : <AuthForm label="Создать аккаунт" submit={register}>
          <EmailField />
          <PasswordField fresh />
          <PasswordField fresh name="confirmation" label="Повторите пароль" />
          <p className={styles.hint}>Пароль должен содержать не менее 8 символов.</p>
        </AuthForm>}
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const auth = useAuth();
  const [sentAt, setSentAt] = useState(0);
  const [waiting, setWaiting] = useState(false);

  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setWaiting(false), Math.max(0, sentAt + RESEND_WAIT - Date.now()));
    return () => clearTimeout(timer);
  }, [sentAt, waiting]);

  if (auth.status !== 'ready') return <AuthUnavailable auth={auth} />;
  if (auth.recovery) return <Navigate to="/reset-password" replace />;

  async function requestReset(values) {
    await auth.requestPasswordReset(values.get('email').trim());
    setSentAt(Date.now());
    setWaiting(true);
  }

  return (
    <AuthFrame title="Восстановление пароля" description="Введите почту, указанную при регистрации."
      links={<Link to="/login">Вернуться ко входу</Link>}>
      <AuthForm label={sentAt ? 'Отправить повторно' : 'Отправить ссылку'} submit={requestReset} disabled={waiting}>
        <EmailField />
        {sentAt !== 0 && <p className={styles.hint} role="status">
          Если аккаунт с этой почтой существует, на неё придёт ссылка. Откройте её в этом же браузере.
          {waiting && ' Повторная отправка доступна через минуту.'}
        </p>}
      </AuthForm>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  if (auth.status !== 'ready') return <AuthUnavailable auth={auth} />;

  if (!auth.session || !auth.recovery) {
    return <div className={styles.page}>
      <Status title="Ссылка для сброса недействительна" heading="h1" kind="error"
        action={<Action to="/forgot-password">Запросить новую ссылку</Action>}>
        Откройте актуальную ссылку из письма о восстановлении пароля.
      </Status>
    </div>;
  }

  async function savePassword(values) {
    await auth.updatePassword(checkedPassword(values));
    auth.finishRecovery();
    navigate('/profile', { replace: true });
  }

  return (
    <AuthFrame title="Новый пароль">
      <AuthForm label="Сохранить пароль" submit={savePassword}>
        <PasswordField fresh label="Новый пароль" />
        <PasswordField fresh name="confirmation" label="Повторите пароль" />
        <p className={styles.hint}>Пароль должен содержать не менее 8 символов.</p>
      </AuthForm>
    </AuthFrame>
  );
}
