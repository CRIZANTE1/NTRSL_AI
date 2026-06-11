import { logger } from './logger';

export const NTRSL_INAPP_NOTIFY_EVENT = 'ntrsl-inapp-notify';

const STORAGE_KEY = 'ntrsl_in_app_notifications_v1';
const MAX_STORED = 40;

export type InAppStoredNotification = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  route: string | null;
  createdAt: string;
  read: boolean;
};

function safeParse(raw: string | null): InAppStoredNotification[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter(
      (x): x is InAppStoredNotification =>
        typeof x === 'object' &&
        x !== null &&
        typeof (x as InAppStoredNotification).id === 'string' &&
        typeof (x as InAppStoredNotification).title === 'string',
    );
  } catch (e) {
    logger.warn('inAppNotificationStore', 'JSON inválido no storage', e);
    return [];
  }
}

function readAll(): InAppStoredNotification[] {
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeAll(items: InAppStoredNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
  } catch (e) {
    logger.warn('inAppNotificationStore', 'Falha ao gravar storage', e);
  }
}

export function routeFromPushPayload(data: Record<string, string>): string | null {
  const type = (data.type ?? '').toLowerCase();

  if (type.includes('ai') || type.includes('recomendacao') || type.includes('gemini')) {
    return '/home';
  }

  if (type.includes('lembrete') || type.includes('diario') || type.includes('daily')) {
    return '/home';
  }

  if (type.includes('historico') || type.includes('log')) {
    return '/historico';
  }

  return '/home';
}

function stringifyData(data: Record<string, unknown> | undefined): Record<string, string> {
  if (!data) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : String(v);
  }
  return out;
}

export function appendInAppNotificationFromPush(notification: {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}): void {
  const data = stringifyData(notification.data as Record<string, unknown> | undefined);
  const title = (notification.title ?? '').trim() || 'Notificação';
  const body = (notification.body ?? '').trim() || null;
  const route = routeFromPushPayload(data);
  const type = data.type ?? 'push';
  const id = `push-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const next: InAppStoredNotification = {
    id,
    title,
    body,
    type,
    route,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const list = readAll();
  writeAll([next, ...list].slice(0, MAX_STORED));
  try {
    window.dispatchEvent(new CustomEvent(NTRSL_INAPP_NOTIFY_EVENT));
  } catch {
    /* ignore */
  }
}

export function getInAppNotifications(): InAppStoredNotification[] {
  return readAll();
}

export function getUnreadInAppNotificationCount(): number {
  return readAll().filter((n) => !n.read).length;
}

export function markAllInAppNotificationsRead(): void {
  const list = readAll().map((n) => ({ ...n, read: true }));
  writeAll(list);
}

export function clearInAppNotifications(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    logger.warn('inAppNotificationStore', 'Falha ao limpar storage', e);
  }
}
