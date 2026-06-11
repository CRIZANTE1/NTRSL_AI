import React, { useCallback, useState } from 'react';
import { colors } from '../theme/colors';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePendingOutboxCount } from '../hooks/usePendingOutboxCount';
import { ensureLocalDb } from '../lib/localDb';
import { processOutbox } from '../lib/data/outboxSync';
import { notifyOfflineDataChanged } from '../lib/data/offlineEvents';

/**
 * Banner quando offline; faixa compacta quando há fila local a sincronizar (online).
 */
export function NetworkBanner() {
  const isOnline = useOnlineStatus();
  const pending = usePendingOutboxCount();
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleRetry = useCallback(async () => {
    setChecking(true);
    try {
      const { error } = await supabase.auth.getSession();
      if (error) {
        logger.warn('NetworkBanner', 'getSession após retry', error);
        if (navigator.onLine) {
          window.location.reload();
          return;
        }
      }
    } catch (e) {
      logger.warn('NetworkBanner', 'Falha no ping ao Supabase', e);
      if (navigator.onLine) {
        window.location.reload();
      }
    } finally {
      setChecking(false);
    }
  }, []);

  const handleSyncNow = useCallback(async () => {
    setSyncing(true);
    try {
      await ensureLocalDb();
      await processOutbox();
      notifyOfflineDataChanged();
    } catch (e) {
      logger.warn('NetworkBanner', 'Falha ao sincronizar fila', e);
    } finally {
      setSyncing(false);
    }
  }, []);

  if (!isOnline) {
    return (
      <div
        className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between gap-3 border-b px-4 py-3 shadow-sm"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top, 0px))',
          background: colors.surface,
          borderColor: colors.border,
        }}
        role="status"
        aria-live="polite"
      >
        <p className="text-sm font-medium flex-1 min-w-0" style={{ color: colors.textPrimary }}>
          Sem conexão. Os dados exibidos podem estar em cache.
          {pending > 0 ? ` ${pending} alteração(ões) aguardando envio.` : ''}
        </p>
        <button
          type="button"
          disabled={checking}
          onClick={() => void handleRetry()}
          className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-60"
          style={{ background: colors.accent, color: colors.textPrimary }}
        >
          {checking ? 'Verificando…' : 'Tentar de novo'}
        </button>
      </div>
    );
  }

  if (pending > 0) {
    return (
      <div
        className="fixed left-0 right-0 top-0 z-[100] flex items-center justify-between gap-3 border-b px-4 py-2.5 shadow-sm"
        style={{
          paddingTop: 'max(8px, env(safe-area-inset-top, 0px))',
          background: colors.surfaceWarm,
          borderColor: colors.border,
        }}
        role="status"
        aria-live="polite"
      >
        <p className="text-xs sm:text-sm flex-1 min-w-0" style={{ color: colors.textSecondary }}>
          <span className="font-semibold" style={{ color: colors.textPrimary }}>
            {pending}
          </span>{' '}
          {pending === 1 ? 'alteração pendente' : 'alterações pendentes'} de sincronização.
        </p>
        <button
          type="button"
          disabled={syncing}
          onClick={() => void handleSyncNow()}
          className="shrink-0 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-semibold disabled:opacity-60 border"
          style={{ background: colors.accent, color: colors.textPrimary, borderColor: colors.border }}
        >
          {syncing ? 'Sincronizando…' : 'Sincronizar agora'}
        </button>
      </div>
    );
  }

  return null;
}
