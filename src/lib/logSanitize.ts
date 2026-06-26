/**
 * Sanitização de entradas de log antes de persistir em localStorage
 * (evita tokens JWT, PII óbvia e stacks enormes em dispositivos compartilhados).
 */

const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g;
const BEARER = /Bearer\s+[^\s]+/gi;
const SENSITIVE_KEYS = new Set([
  'authorization',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'id_token',
  'apikey',
  'api_key',
  'password',
  'secret',
  'cookie',
]);

const MAX_STACK_PERSIST = 720;
const MAX_META_DEPTH = 8;
const MAX_STRING_SCAN = 12_000;

function maskEmail(s: string): string {
  const m = s.match(/^([^@\s]{1,3})[^@]*(@.+)$/);
  if (!m) return '[email]';
  return `${m[1]}***${m[2]}`;
}

function redactString(s: string): string {
  let out = s;
  if (out.length > MAX_STRING_SCAN) out = `${out.slice(0, MAX_STRING_SCAN)}…[truncado]`;
  out = out.replace(JWT_LIKE, '[JWT]');
  out = out.replace(BEARER, 'Bearer [redacted]');
  out = out.replace(/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g, (em) => maskEmail(em));
  return out;
}

function isPostgrestLike(v: unknown): v is { code?: string; message?: string; details?: string; hint?: string } {
  return (
    v !== null &&
    typeof v === 'object' &&
    ('code' in (v as object) || 'message' in (v as object)) &&
    typeof (v as { message?: unknown }).message === 'string'
  );
}

function sanitizeUnknown(value: unknown, depth: number): unknown {
  if (depth > MAX_META_DEPTH) return '[profundidade máxima]';

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return redactString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactString(value.message),
      stack:
        typeof value.stack === 'string'
          ? redactString(value.stack).slice(0, MAX_STACK_PERSIST)
          : undefined,
    };
  }

  if (Array.isArray(value)) {
    return value.map((x) => sanitizeUnknown(x, depth + 1));
  }

  if (typeof value === 'object') {
    if (isPostgrestLike(value)) {
      const o = value as { code?: string; message: string; details?: string; hint?: string };
      return {
        code: o.code,
        message: redactString(o.message),
        details: o.details ? redactString(String(o.details)).slice(0, 400) : undefined,
        hint: o.hint ? redactString(String(o.hint)).slice(0, 200) : undefined,
      };
    }

    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const kl = k.toLowerCase();
      if (SENSITIVE_KEYS.has(kl)) {
        out[k] = '[redacted]';
        continue;
      }
      if (kl === 'stack' && typeof v === 'string') {
        out[k] = redactString(v).slice(0, MAX_STACK_PERSIST);
        continue;
      }
      out[k] = sanitizeUnknown(v, depth + 1);
    }
    return out;
  }

  return '[tipo não suportado]';
}

export function sanitizeLogMessageForPersistence(message: string): string {
  return redactString(message).slice(0, 4000);
}

export function sanitizeLogMetaForPersistence(meta: unknown): unknown {
  if (meta === undefined) return undefined;
  return sanitizeUnknown(meta, 0);
}
