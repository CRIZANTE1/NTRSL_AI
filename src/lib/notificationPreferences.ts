export type NotifPrefKey = 'ai_resposta' | 'lembrete_diario';

const STORAGE_PREFIX = 'ntrsl_notif_pref_';

const DEFAULTS: Record<NotifPrefKey, boolean> = {
  ai_resposta: true,
  lembrete_diario: true,
};

function prefKey(key: NotifPrefKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export function getNotifPref(key: NotifPrefKey): boolean {
  try {
    const raw = localStorage.getItem(prefKey(key));
    if (raw === null) return DEFAULTS[key];
    return raw === '1' || raw === 'true';
  } catch {
    return DEFAULTS[key];
  }
}

export function setNotifPref(key: NotifPrefKey, value: boolean): void {
  try {
    localStorage.setItem(prefKey(key), value ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function typeToPref(type: string): NotifPrefKey | null {
  const t = type.toLowerCase();
  if (t.includes('ai') || t.includes('recomendacao') || t.includes('gemini')) {
    return 'ai_resposta';
  }
  if (t.includes('lembrete') || t.includes('diario') || t.includes('daily')) {
    return 'lembrete_diario';
  }
  return null;
}

/** Retorna false se o utilizador desligou este tipo de notificação in-app. */
export function shouldShowNotif(type: string): boolean {
  const pref = typeToPref(type);
  if (!pref) return true;
  return getNotifPref(pref);
}

export const NOTIF_PREF_LABELS: Record<NotifPrefKey, { title: string; description: string }> = {
  ai_resposta: {
    title: 'Resposta da IA',
    description: 'Quando uma recomendação de saúde estiver pronta.',
  },
  lembrete_diario: {
    title: 'Lembrete diário',
    description: 'Lembretes para registrar refeições e exercícios.',
  },
};
