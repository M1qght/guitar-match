import { useEffect, useState } from 'react';
import { getSupabase } from '../../shared/supabase';
import { AuthContext } from './authContext';

const recoveryKey = 'guitarmatch-recovery-user';

function recoveryUser() {
  try { return sessionStorage.getItem(recoveryKey); } catch { return null; }
}

function rememberRecovery(userId) {
  try {
    if (userId) sessionStorage.setItem(recoveryKey, userId);
    else sessionStorage.removeItem(recoveryKey);
  } catch {
    // Recovery still works in the current view if storage is unavailable.
  }
}

async function authRequest(request, message) {
  const { data, error } = await request(getSupabase().auth);
  if (error) throw new Error(message);
  return data;
}

const actions = {
  async signIn(email, password) {
    await authRequest((auth) => auth.signInWithPassword({ email, password }),
      'Не удалось войти. Проверьте почту, пароль и подтверждение регистрации.');
  },
  async signUp(email, password) {
    const { session } = await authRequest((auth) => auth.signUp({
      email, password, options: { emailRedirectTo: new URL('/profile', location.origin).href },
    }), 'Не удалось зарегистрироваться. Проверьте данные и повторите позже.');
    return Boolean(session);
  },
  requestPasswordReset(email) {
    return authRequest((auth) => auth.resetPasswordForEmail(email, {
      redirectTo: new URL('/reset-password', location.origin).href,
    }), 'Не удалось отправить письмо. Попробуйте позже.');
  },
  updatePassword(password) {
    return authRequest((auth) => auth.updateUser({ password }),
      'Не удалось изменить пароль. Проверьте требования к паролю или запросите новую ссылку.');
  },
  signOut() {
    return authRequest((auth) => auth.signOut({ scope: 'local' }), 'Не удалось выйти. Попробуйте ещё раз.');
  },
};

export default function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ status: 'loading', session: null, recovery: false, error: null });

  useEffect(() => {
    try {
      const { data: { subscription } } = getSupabase().auth.onAuthStateChange((event, session) => {
        const userId = session?.user.id;
        if (event === 'PASSWORD_RECOVERY') rememberRecovery(userId);
        else if (!userId || recoveryUser() !== userId) rememberRecovery(null);
        setAuth((current) => ({
          status: 'ready', session, error: null,
          recovery: Boolean(userId && (event === 'PASSWORD_RECOVERY'
            || recoveryUser() === userId
            || (current.recovery && current.session?.user.id === userId))),
        }));
      });
      return () => subscription.unsubscribe();
    } catch (error) {
      setAuth({ status: 'error', session: null, recovery: false, error: error.message });
    }
  }, []);

  function finishRecovery() {
    rememberRecovery(null);
    setAuth((current) => ({ ...current, recovery: false }));
  }

  return <AuthContext.Provider value={{ ...auth, ...actions, finishRecovery }}>{children}</AuthContext.Provider>;
}
