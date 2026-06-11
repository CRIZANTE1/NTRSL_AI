import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import { logger } from './logger';
import { fetchWithRetry } from './supabaseFetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const msg =
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias no .env / .env.local';
  logger.error('supabase', msg);
  throw new Error(msg);
}

if (
  !supabaseUrl.startsWith('http://') &&
  !supabaseUrl.startsWith('https://')
) {
  throw new Error('VITE_SUPABASE_URL deve começar com http:// ou https://');
}

/**
 * Cliente Supabase (anon), alinhado ao padrão de ISFIA_ANDROID (`src/lib/supabase.ts`).
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    fetch: fetchWithRetry,
    headers: {
      'x-client-info': 'ntrsl-ai-app',
    },
  },
  db: {
    schema: 'public',
  },
}) as ReturnType<typeof createClient<Database>>;
