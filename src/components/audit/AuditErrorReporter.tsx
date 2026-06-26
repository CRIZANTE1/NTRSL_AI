import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logCriticalError } from '../../lib/audit';
import { logger } from '../../lib/logger';

/**
 * Reporta erros não tratados (window.onerror / unhandledrejection) para o Supabase.
 * Não interfere no Login; só registra quando há sessão e email.
 */
export function AuditErrorReporter({ children }: { children: React.ReactNode }) {
  const { profile, session } = useAuth();
  const location = useLocation();
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    const email = session?.user?.email ?? profile?.email ?? null;
    if (!email) return;

    const send = async (message: string, stack?: string | null, meta?: Record<string, unknown>) => {
      // Dedup simples para evitar spam em loop de render
      const key = `${message}::${stack ?? ''}::${location.pathname}`;
      if (lastSentRef.current === key) return;
      lastSentRef.current = key;

      await logCriticalError({
        organization_id: null,
        actor_user_id: profile?.id ?? null,
        actor_email: email,
        actor_role: profile?.role ?? null,
        message,
        stack: stack ?? null,
        route: location.pathname,
        severity: 'critical',
        metadata: meta ?? null,
      });
    };

    const onError = (event: ErrorEvent) => {
      const message = event.message || 'Erro não tratado';
      const stack = (event.error && (event.error.stack as string)) || null;
      logger.error('global', message, {
        stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        route: location.pathname,
      });
      void send(message, stack, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason: any = event.reason;
      const message = String(reason?.message ?? reason ?? 'Promise rejeitada sem tratamento');
      const stack = (reason && reason.stack) || null;
      logger.error('global', message, { stack, route: location.pathname });
      void send(message, stack);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [location.pathname, profile, session]);

  return <>{children}</>;
}

