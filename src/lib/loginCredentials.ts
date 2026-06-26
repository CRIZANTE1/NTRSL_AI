import { Preferences } from '@capacitor/preferences';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { logger } from './logger';

const REMEMBER_EMAIL_KEY = 'ntrsl_remember_email';
const REMEMBER_EMAIL_ENABLED_KEY = 'ntrsl_remember_email_enabled';
const BIOMETRIC_LOGIN_KEY = 'ntrsl_biometric_login_enabled';
const SECURE_CREDS_KEY = 'login_creds';

type StoredCreds = { email: string; password: string };

export async function getRememberEmailEnabled(): Promise<boolean> {
  try {
    const { value } = await Preferences.get({ key: REMEMBER_EMAIL_ENABLED_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setRememberEmailEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: REMEMBER_EMAIL_ENABLED_KEY, value: String(enabled) });
  if (!enabled) await Preferences.remove({ key: REMEMBER_EMAIL_KEY });
}

export async function getRememberedEmail(): Promise<string | null> {
  if (!(await getRememberEmailEnabled())) return null;
  try {
    const { value } = await Preferences.get({ key: REMEMBER_EMAIL_KEY });
    return value?.trim() || null;
  } catch {
    return null;
  }
}

export async function saveRememberedEmail(email: string): Promise<void> {
  await Preferences.set({ key: REMEMBER_EMAIL_KEY, value: email.trim() });
}

export async function getBiometricLoginEnabled(): Promise<boolean> {
  try {
    const { value } = await Preferences.get({ key: BIOMETRIC_LOGIN_KEY });
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricLoginEnabled(enabled: boolean): Promise<void> {
  await Preferences.set({ key: BIOMETRIC_LOGIN_KEY, value: String(enabled) });
  if (!enabled) await clearLoginCredentials();
}

export async function saveLoginCredentials(email: string, password: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await SecureStorage.set(SECURE_CREDS_KEY, { email: email.trim(), password } satisfies StoredCreds);
  } catch (e) {
    logger.warn('loginCredentials', 'Falha ao guardar credenciais seguras', e);
  }
}

export async function clearLoginCredentials(): Promise<void> {
  try {
    await SecureStorage.remove(SECURE_CREDS_KEY);
  } catch {
    // ignore
  }
}

export async function authenticateAndGetCredentials(): Promise<StoredCreds | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    await BiometricAuth.authenticate({
      reason: 'Entre com biometria ou PIN do dispositivo',
      cancelTitle: 'Cancelar',
      allowDeviceCredential: true,
      androidTitle: 'NTRSL AI',
    });
    const data = await SecureStorage.get(SECURE_CREDS_KEY);
    if (data && typeof data === 'object' && data !== null && 'email' in data && 'password' in data) {
      const creds = data as StoredCreds;
      if (creds.email && creds.password) return creds;
    }
  } catch (e) {
    logger.warn('loginCredentials', 'Autenticação biométrica cancelada ou falhou', e);
  }
  return null;
}

export async function isBiometricLoginAvailable(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    if (!(await getBiometricLoginEnabled())) return false;
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable && !info.deviceIsSecure) return false;
    const creds = await SecureStorage.get(SECURE_CREDS_KEY);
    return creds != null;
  } catch {
    return false;
  }
}
