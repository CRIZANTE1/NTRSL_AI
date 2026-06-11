import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { ensureLocalDb } from '../lib/localDb';
import { processOutbox } from '../lib/data/outboxSync';
import { notifyOfflineDataChanged } from '../lib/data/offlineEvents';

/**
 * Quando a rede volta ou o app volta ao primeiro plano, tenta enviar a fila local ao Supabase.
 */
export function OfflineSyncEffects() {
  useEffect(() => {
    const run = () => {
      if (typeof navigator === 'undefined' || !navigator.onLine) return;
      void (async () => {
        await ensureLocalDb();
        await processOutbox();
        notifyOfflineDataChanged();
      })();
    };

    run();
    window.addEventListener('online', run);

    let appListener: { remove: () => Promise<void> } | undefined;
    if (Capacitor.getPlatform() !== 'web') {
      void App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) run();
      }).then((h) => {
        appListener = h;
      });
    }

    return () => {
      window.removeEventListener('online', run);
      void appListener?.remove();
    };
  }, []);

  return null;
}
