export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'ntrsl_theme';

export function getTheme(): AppTheme {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setTheme(next: AppTheme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', next === 'dark');
  }
}

export function toggleTheme(current: AppTheme): AppTheme {
  const next: AppTheme = current === 'light' ? 'dark' : 'light';
  setTheme(next);
  return next;
}

export function clearThemePreference() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

