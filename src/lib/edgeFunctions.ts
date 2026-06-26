import { supabase } from './supabase';

function getSupabaseConfig(): { url: string; anon: string } {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error('Supabase não configurado.');
  }
  return { url, anon };
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }
  return token;
}

/**
 * Chama uma Edge Function do Supabase com JWT do usuário.
 */
export async function callEdgeFunction<T>(
  name: string,
  options?: { method?: 'GET' | 'POST'; body?: unknown },
): Promise<T> {
  const { url, anon } = getSupabaseConfig();
  const token = await getAccessToken();
  const method = options?.method ?? 'POST';

  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/${name}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: method === 'POST' ? JSON.stringify(options?.body ?? {}) : undefined,
  });

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; detail?: string; message?: string };
      message = body.error ?? body.detail ?? body.message ?? message;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}
