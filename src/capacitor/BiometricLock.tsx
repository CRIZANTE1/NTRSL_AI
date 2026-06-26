import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { BiometricAuth, BiometryError } from '@aparajita/capacitor-biometric-auth';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../theme/colors';
import {
  getBiometricLockEnabled,
  getBiometricLockMinutes,
} from '../lib/biometricSettings';
import { logger } from '../lib/logger';

/**
 * Trava a UI após tempo em background quando a opção está ativa (nativo).
 * Se o dispositivo não permitir desbloqueio (sem PIN/credencial e sem biometria), não bloqueia a app.
 */
export function BiometricLock() {
  const { session, signOut } = useAuth();
  const [lockScreen, setLockScreen] = useState(false);
  const lastBackgroundAt = useRef<number>(0);

  const tryUnlock = useCallback(async (): Promise<boolean> => {
    try {
      await BiometricAuth.authenticate({
        reason: 'Desbloqueie o app para continuar.',
        cancelTitle: 'Cancelar',
        allowDeviceCredential: true,
        androidTitle: 'NTRSL AI',
      });
      setLockScreen(false);
      return true;
    } catch (e) {
      if (e instanceof BiometryError) {
        logger.warn('biometric', 'Autenticação cancelada ou falhou', e.code);
      } else {
        logger.warn('biometric', 'Autenticação falhou', e);
      }
      return false;
    }
  }, []);

  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    let handle: { remove: () => Promise<void> } | undefined;

    void App.addListener('appStateChange', ({ isActive }) => {
      if (!getBiometricLockEnabled() || !session) {
        return;
      }

      if (!isActive) {
        lastBackgroundAt.current = Date.now();
        return;
      }

      const bg = lastBackgroundAt.current;
      if (bg <= 0) return;

      const mins = getBiometricLockMinutes();
      if (Date.now() - bg < mins * 60 * 1000) {
        return;
      }

      void (async () => {
        try {
          const info = await BiometricAuth.checkBiometry();
          if (!info.deviceIsSecure && !info.isAvailable) {
            logger.warn('biometric', 'Sem PIN nem biometria: bloqueio ignorado');
            return;
          }
          setLockScreen(true);
        } catch (e) {
          logger.warn('biometric', 'checkBiometry falhou; bloqueio ignorado', e);
        }
      })();
    }).then((h) => {
      handle = h;
    });

    return () => {
      void handle?.remove();
    };
  }, [session]);

  useEffect(() => {
    if (!lockScreen || Capacitor.getPlatform() === 'web') return;
    let cancelled = false;
    void (async () => {
      try {
        await BiometricAuth.checkBiometry();
      } catch {
        /* dispositivo pode não suportar */
      }
      if (cancelled) return;
      await tryUnlock();
    })();
    return () => {
      cancelled = true;
    };
  }, [lockScreen, tryUnlock]);

  if (!lockScreen || Capacitor.getPlatform() === 'web') {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[250] flex flex-col items-center justify-center gap-6 px-6"
      style={{ background: colors.background }}
      role="dialog"
      aria-modal="true"
      aria-label="Desbloquear aplicativo"
    >
      <p className="text-lg font-medium text-center" style={{ color: colors.textPrimary }}>
        App bloqueado
      </p>
      <p className="text-sm text-center max-w-sm" style={{ color: colors.textSecondary }}>
        Use biometria ou o PIN do dispositivo para continuar.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          type="button"
          className="rounded-2xl py-3 px-4 font-semibold border"
          style={{ background: colors.accent, color: colors.textPrimary, borderColor: colors.border }}
          onClick={() => void tryUnlock()}
        >
          Desbloquear
        </button>
        <button
          type="button"
          className="rounded-2xl py-3 px-4 font-medium border"
          style={{ background: colors.surface, color: colors.textSecondary, borderColor: colors.border }}
          onClick={() => void signOut()}
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
}
