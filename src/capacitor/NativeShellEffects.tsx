import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { colors } from '../theme/colors';

/**
 * Efeitos nativos (Capacitor): splash, status bar, teclado iOS, botão Voltar Android.
 * No browser não faz nada.
 */
export function NativeShellEffects() {
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') {
      return;
    }

    let cancelled = false;
    const backListenerPromise = (async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      if (cancelled) return undefined;

      await SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {});
      if (cancelled) return undefined;

      await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
      await StatusBar.setBackgroundColor({ color: colors.background }).catch(() => {});
      if (cancelled) return undefined;

      if (Capacitor.getPlatform() === 'ios') {
        await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
      }
      if (cancelled) return undefined;

      return App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          void App.exitApp();
        }
      });
    })();

    return () => {
      cancelled = true;
      void backListenerPromise.then((handle) => handle?.remove());
    };
  }, []);

  return null;
}
