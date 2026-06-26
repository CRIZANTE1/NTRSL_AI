import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useNavigate } from 'react-router-dom';
import { logger } from '../lib/logger';
import { isNativePushEnabled } from '../lib/pushFlags';
import { supabase } from '../lib/supabase';
import { registerPushDeviceToken } from '../lib/pushBackend';
import { appendInAppNotificationFromPush, routeFromPushPayload } from '../lib/inAppNotificationStore';
import { shouldShowNotif } from '../lib/notificationPreferences';
import { setCachedFcmToken, syncCachedPushTokenWithSession } from '../lib/pushTokenSync';

function getPushData(data: Record<string, unknown> | undefined): Record<string, string> {
  if (!data) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    out[k] = typeof v === 'string' ? v : String(v);
  }
  return out;
}

/**
 * Registra FCM (Android/iOS) e envia o token ao Supabase. Falhas de push não afetam o resto da app.
 */
export function PushNotificationsEffects() {
  const navigate = useNavigate();

  useEffect(() => {
    if (Capacitor.getPlatform() === 'web' || !isNativePushEnabled()) {
      return;
    }

    let removeRegistration: (() => void) | undefined;
    let removeAction: (() => void) | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        const perm = await PushNotifications.requestPermissions().catch((e: unknown) => {
          logger.warn('push', 'requestPermissions falhou (ignorado)', e);
          return { receive: 'denied' as const };
        });
        if (perm.receive !== 'granted') {
          logger.warn('push', 'Permissão de notificações negada ou indisponível');
          return;
        }

        await PushNotifications.register().catch((e: unknown) => {
          logger.warn('push', 'register falhou (app continua sem push)', e);
        });

        const regHandle = await PushNotifications.addListener('registration', async (t) => {
          if (cancelled) return;
          try {
            const token = t.value;
            if (!token) return;
            setCachedFcmToken(token);
            const { data: sess } = await supabase.auth.getSession();
            if (!sess.session?.access_token) return;
            const platform = Capacitor.getPlatform() === 'ios' ? 'ios' : 'android';
            const r = await registerPushDeviceToken(token, platform);
            if (!r.ok) {
              logger.warn('push', 'Falha ao registrar token no servidor (app continua)', r.error);
            }
          } catch (e) {
            logger.warn('push', 'Erro ao processar token de registo (ignorado)', e);
          }
        });

        const errHandle = await PushNotifications.addListener('registrationError', (e) => {
          logger.warn('push', 'Registo FCM indisponível ou falhou (app continua)', e);
        });

        removeRegistration = () => {
          void regHandle.remove();
          void errHandle.remove();
        };

        const actHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (ev) => {
          try {
            const data = getPushData(ev.notification.data as Record<string, unknown> | undefined);
            const route = routeFromPushPayload(data);
            if (route) {
              try {
                navigate(route);
              } catch (e) {
                logger.warn('push', 'Navegação após notificação ignorada', e);
              }
            }
          } catch (e) {
            logger.warn('push', 'Handler de ação ignorado', e);
          }
        });

        const fgHandle = await PushNotifications.addListener('pushNotificationReceived', (ev) => {
          try {
            const data = getPushData(ev.notification.data as Record<string, unknown> | undefined);
            const type = (data.type ?? 'push').toLowerCase();
            if (!shouldShowNotif(type)) return;
            appendInAppNotificationFromPush({
              title: ev.notification.title,
              body: ev.notification.body,
              data: ev.notification.data as Record<string, unknown> | undefined,
            });
          } catch (e) {
            logger.warn('push', 'Não foi possível registrar aviso in-app', e);
          }
        });

        removeAction = () => {
          void actHandle.remove();
          void fgHandle.remove();
        };
      } catch (e) {
        logger.warn('push', 'Push não configurado ou plugin indisponível (app continua)', e);
      }
    };

    void setup();

    return () => {
      cancelled = true;
      removeRegistration?.();
      removeAction?.();
    };
  }, [navigate]);

  useEffect(() => {
    if (Capacitor.getPlatform() === 'web' || !isNativePushEnabled()) return;
    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      if (sess && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        void syncCachedPushTokenWithSession();
        void PushNotifications.register().catch(() => {
          /* silencioso: sem push não bloqueia sessão */
        });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
