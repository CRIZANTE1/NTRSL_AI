import { supabase } from './supabase';

/**
 * Registra token FCM na Edge Function `push-register` (Supabase).
 */
export async function registerPushDeviceToken(fcmToken: string, platform: 'android' | 'ios' | 'web'): Promise<{ ok: boolean; error?: string }> {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false, error: 'Supabase não configurado.' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    return { ok: false, error: 'Sem sessão.' };
  }

  const endpoint = `${url.replace(/\/$/, '')}/functions/v1/push-register`;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anon,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fcm_token: fcmToken, platform }),
    });

    if (!res.ok) {
      const t = await res.text();
      return { ok: false, error: t || res.statusText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
