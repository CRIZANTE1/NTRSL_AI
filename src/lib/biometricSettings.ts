const KEY_ENABLED = 'ntrsl_biometric_lock_enabled';
const KEY_MINUTES = 'ntrsl_biometric_lock_minutes';

const DEFAULT_MINUTES = 5;

export function getBiometricLockEnabled(): boolean {
  try {
    return window.localStorage.getItem(KEY_ENABLED) === '1';
  } catch {
    return false;
  }
}

export function setBiometricLockEnabled(enabled: boolean): void {
  window.localStorage.setItem(KEY_ENABLED, enabled ? '1' : '0');
}

export function getBiometricLockMinutes(): number {
  try {
    const raw = window.localStorage.getItem(KEY_MINUTES);
    const n = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(n) && n >= 1 && n <= 60) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_MINUTES;
}

export function setBiometricLockMinutes(minutes: number): void {
  const n = Math.min(60, Math.max(1, Math.round(minutes)));
  window.localStorage.setItem(KEY_MINUTES, String(n));
}
