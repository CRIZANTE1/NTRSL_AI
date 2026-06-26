import { logger } from './logger';

const BASE_DELAY_MS = 400;
const MAX_ATTEMPTS = 3;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function jitter(ms: number) {
  return ms + Math.floor(Math.random() * 120);
}

function shouldRetryResponse(res: Response): boolean {
  return res.status >= 500 && res.status <= 599;
}

function shouldRetryError(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const name = err && typeof err === 'object' && 'name' in err ? String((err as Error).name) : '';
  return name === 'AbortError';
}

/**
 * Fetch com retry para o cliente Supabase: rede/timeout/5xx.
 * Não repete em 4xx (evita duplicar operações não idempotentes).
 */
export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(input, init);
      if (shouldRetryResponse(res) && attempt < MAX_ATTEMPTS) {
        const delay = jitter(BASE_DELAY_MS * 2 ** (attempt - 1));
        await sleep(delay);
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (!shouldRetryError(e) || attempt >= MAX_ATTEMPTS) {
        logger.error('supabase-fetch', `fetch falhou (tentativa ${attempt}/${MAX_ATTEMPTS})`, e);
        throw e instanceof Error ? e : new Error(String(e));
      }
      const delay = jitter(BASE_DELAY_MS * 2 ** (attempt - 1));
      await sleep(delay);
    }
  }

  logger.error('supabase-fetch', 'fetch esgotou tentativas', lastErr);
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}
