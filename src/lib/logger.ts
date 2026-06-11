/**
 * Logger com nível configurável e persistência opcional em localStorage.
 *
 * - `VITE_LOG_LEVEL`: debug | info | warn | error (padrão: debug em DEV, warn em produção)
 * - `VITE_LOG_PERSIST`: 1/true para gravar logs em localStorage — **apenas diagnóstico**;
 *   em builds para loja mantenha desligado em dispositivos compartilhados.
 *
 * Entradas persistidas passam por sanitização (sem JWT, chaves sensíveis truncadas, stack limitada).
 */
import { sanitizeLogMessageForPersistence, sanitizeLogMetaForPersistence } from './logSanitize';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogEntry = {
  ts: string;
  level: LogLevel;
  scope: string;
  message: string;
  meta?: unknown;
};

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function normalizeLevel(value: unknown): LogLevel | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'debug' || v === 'info' || v === 'warn' || v === 'error') return v;
  return null;
}

function boolFromEnv(value: unknown): boolean | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === '1' || v === 'true' || v === 'yes' || v === 'on') return true;
  if (v === '0' || v === 'false' || v === 'no' || v === 'off') return false;
  return null;
}

function safeStringify(value: unknown): string {
  if (value instanceof Error) return value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function normalizeMessage(message: unknown): string {
  const s = safeStringify(message);
  return s.length ? s : '(sem mensagem)';
}

const STORAGE_KEY = 'ntrsl_logs_v1';
const MAX_PERSISTED = 400;

function shouldPersist(): boolean {
  const configured = boolFromEnv(import.meta.env.VITE_LOG_PERSIST);
  if (configured !== null) return configured;
  return Boolean(import.meta.env.DEV);
}

function minLevel(): LogLevel {
  const configured = normalizeLevel(import.meta.env.VITE_LOG_LEVEL);
  if (configured) return configured;
  return import.meta.env.DEV ? 'debug' : 'warn';
}

function sanitizeEntryForPersistence(entry: LogEntry): LogEntry {
  return {
    ...entry,
    message: sanitizeLogMessageForPersistence(entry.message),
    meta:
      entry.meta === undefined ? undefined : sanitizeLogMetaForPersistence(entry.meta),
  };
}

function readRawPersisted(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as LogEntry[]) : [];
  } catch {
    return [];
  }
}

function readPersisted(): LogEntry[] {
  return readRawPersisted().map((e) => sanitizeEntryForPersistence(e));
}

function writePersisted(next: LogEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = next.map(sanitizeEntryForPersistence);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized.slice(-MAX_PERSISTED)));
  } catch {
    // ignore
  }
}

function persist(entry: LogEntry) {
  if (!shouldPersist()) return;
  const safe = sanitizeEntryForPersistence(entry);
  const prev = readRawPersisted();
  prev.push(safe);
  writePersisted(prev);
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[minLevel()];
}

function emitToConsole(entry: LogEntry) {
  const prefix = `[${entry.ts}] [${entry.scope}]`;
  const args = entry.meta === undefined ? [prefix, entry.message] : [prefix, entry.message, entry.meta];

  if (entry.level === 'debug') console.debug(...args);
  else if (entry.level === 'info') console.info(...args);
  else if (entry.level === 'warn') console.warn(...args);
  else console.error(...args);
}

function log(level: LogLevel, scope: string, message: unknown, meta?: unknown) {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    scope: scope || 'app',
    message: normalizeMessage(message),
    meta,
  };

  emitToConsole(entry);
  persist(entry);
}

export const logger = {
  debug: (scope: string, message: unknown, meta?: unknown) => log('debug', scope, message, meta),
  info: (scope: string, message: unknown, meta?: unknown) => log('info', scope, message, meta),
  warn: (scope: string, message: unknown, meta?: unknown) => log('warn', scope, message, meta),
  error: (scope: string, message: unknown, meta?: unknown) => log('error', scope, message, meta),

  getPersisted: (): LogEntry[] => readPersisted(),
  clearPersisted: () => writePersisted([]),
};
