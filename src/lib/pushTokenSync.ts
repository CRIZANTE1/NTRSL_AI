import { Capacitor } from '@capacitor/core';
import { registerPushDeviceToken } from './pushBackend';
import { logger } from './logger';

let cachedFcmToken: string | null = null;

/** Guarda o último token FCM recebido do plugin nativo. */
export function setCachedFcmToken(token: string | null): void {
  cachedFcmToken = token?.trim() || null;
}

export function getCachedFcmToken(): string | null {
  return cachedFcmToken;
}

/** Reenvia o token ao `push-register` quando a sessão Supabase fica ativa. */
export async function syncCachedPushTokenWithSession(): Promise<void> {
  if (Capacitor.getPlatform() === 'web' || !cachedFcmToken) return;

  const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
  const r = await registerPushDeviceToken(cachedFcmToken, platform);
  if (!r.ok) {
    logger.warn('push', 'Falha ao sincronizar token após login (app continua)', r.error);
  }
}
