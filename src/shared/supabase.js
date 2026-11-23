import { createClient } from '@supabase/supabase-js';

let client;

export function getSupabase() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key?.startsWith('sb_publishable_')) {
    throw new Error('Укажите URL Supabase и публичный ключ в настройках приложения.');
  }

  if (!client) {
    try {
      client = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
    } catch {
      throw new Error('Проверьте URL Supabase в настройках приложения.');
    }
  }
  return client;
}
