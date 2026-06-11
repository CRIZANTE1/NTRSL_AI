import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Eraser, Fingerprint, Info, RefreshCw, Shield } from 'lucide-react';
import { AppBackground } from '../components/AppBackground';
import {
  getBiometricLockEnabled,
  getBiometricLockMinutes,
  setBiometricLockEnabled,
  setBiometricLockMinutes,
} from '../lib/biometricSettings';
import { clearThemePreference } from '../lib/theme';
import { getUiSoundsEnabled, setUiSoundsEnabled } from '../lib/sounds';
import {
  getNotifPref,
  NOTIF_PREF_LABELS,
  setNotifPref,
  type NotifPrefKey,
} from '../lib/notificationPreferences';
import { colors } from '../theme/colors';

function clearAppLocalData() {
  try {
    window.localStorage.removeItem('ntrsl_theme');
    window.localStorage.removeItem('ntrsl_notifications_enabled');
    window.localStorage.removeItem('ntrsl_ui_compact');
  } catch {
    // ignore
  }
}

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const [bioLock, setBioLock] = useState(() => getBiometricLockEnabled());
  const [bioMinutes, setBioMinutes] = useState(() => getBiometricLockMinutes());
  const [uiSounds, setUiSounds] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<Record<NotifPrefKey, boolean>>(() => ({
    ai_resposta: getNotifPref('ai_resposta'),
    lembrete_diario: getNotifPref('lembrete_diario'),
  }));

  React.useEffect(() => {
    void getUiSoundsEnabled().then(setUiSounds);
  }, []);

  const minuteOptions = useMemo(() => [1, 2, 5, 10, 15, 30], []);

  return (
    <AppBackground>
      <main className="flex-1 px-6 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl px-4 py-3 flex items-center gap-2 border"
            style={{ background: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-3xl font-light leading-tight" style={{ color: colors.textPrimary }}>
              Privacidade
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Controle dados locais e preferências do dispositivo.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase ml-1" style={{ color: colors.textSecondary }}>
            Dados locais
          </h3>

          <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Info className="w-5 h-5" style={{ color: colors.textPrimary }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  O que fica salvo no dispositivo
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Preferências como tema, notificações no app e ajustes de interface podem ser armazenados localmente.
                </p>
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <button
                type="button"
                onClick={() => {
                  clearThemePreference();
                  window.alert('Preferência de tema removida.');
                }}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 border"
                style={{ background: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
              >
                <RefreshCw className="w-4 h-4" />
                Remover preferência de tema
              </button>

              <button
                type="button"
                onClick={() => {
                  const confirmed = window.confirm('Isso vai apagar preferências locais deste dispositivo. Deseja continuar?');
                  if (!confirmed) return;
                  clearAppLocalData();
                  window.alert('Preferências locais apagadas.');
                }}
                className="w-full mt-3 rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: colors.surfaceWarm, color: colors.textPrimary }}
              >
                <Eraser className="w-4 h-4" />
                Apagar preferências locais
              </button>
              <p className="text-xs mt-2 text-center" style={{ color: colors.textSecondary }}>
                Isso não remove dados do servidor, apenas configurações do app neste aparelho.
              </p>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase ml-1 mt-6" style={{ color: colors.textSecondary }}>
            Segurança
          </h3>

          <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Fingerprint className="w-5 h-5" style={{ color: colors.accent }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Bloqueio ao sair do app
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  No aparelho (Android/iOS), após ficar em segundo plano por um tempo, o app pode pedir biometria ou PIN do
                  dispositivo para voltar. Não substitui a senha da conta.
                </p>
                <label className="mt-3 flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bioLock}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setBioLock(v);
                      setBiometricLockEnabled(v);
                    }}
                    className="h-4 w-4 rounded border"
                    style={{ accentColor: colors.accent }}
                  />
                  <span className="text-sm" style={{ color: colors.textPrimary }}>
                    Ativar bloqueio
                  </span>
                </label>
                {bioLock && (
                  <label className="mt-3 block">
                    <span className="text-xs" style={{ color: colors.textSecondary }}>
                      Tempo em segundo plano antes de bloquear
                    </span>
                    <select
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
                      style={{ background: colors.surfaceWarm, borderColor: colors.border, color: colors.textPrimary }}
                      value={bioMinutes}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setBioMinutes(n);
                        setBiometricLockMinutes(n);
                      }}
                    >
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {m} min
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uiSounds}
                  onChange={(e) => {
                    const v = e.target.checked;
                    setUiSounds(v);
                    void setUiSoundsEnabled(v);
                  }}
                  className="h-4 w-4 rounded border"
                  style={{ accentColor: colors.accent }}
                />
                <span className="text-sm" style={{ color: colors.textPrimary }}>
                  Sons de feedback na interface
                </span>
              </label>
              <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
                Toques curtos em confirmações, erros e ações principais (desligado por padrão).
              </p>
            </div>

            <div className="p-4 border-t flex items-start gap-3" style={{ borderColor: colors.border }}>
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Shield className="w-5 h-5" style={{ color: colors.accent }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Sessão e conta
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Para sair da conta, use o botão “Sair” na tela de Perfil.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase ml-1 mt-6" style={{ color: colors.textSecondary }}>
            Notificações
          </h3>

          <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="p-4 flex items-start gap-3 border-b" style={{ borderColor: colors.border }}>
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Bell className="w-5 h-5" style={{ color: colors.textPrimary }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Push (FCM)
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  No app instalado, aceite a permissão de notificações. O envio depende do Firebase e das funções no
                  Supabase.
                </p>
              </div>
            </div>

            {(Object.keys(NOTIF_PREF_LABELS) as NotifPrefKey[]).map((key) => (
              <div key={key} className="p-4 border-t" style={{ borderColor: colors.border }}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifPrefs[key]}
                    onChange={(e) => {
                      const v = e.target.checked;
                      setNotifPref(key, v);
                      setNotifPrefs((prev) => ({ ...prev, [key]: v }));
                    }}
                    className="h-4 w-4 rounded border mt-0.5 shrink-0"
                    style={{ accentColor: colors.accent }}
                  />
                  <span className="min-w-0">
                    <span className="text-sm font-medium block" style={{ color: colors.textPrimary }}>
                      {NOTIF_PREF_LABELS[key].title}
                    </span>
                    <span className="text-xs mt-0.5 block" style={{ color: colors.textSecondary }}>
                      {NOTIF_PREF_LABELS[key].description}
                    </span>
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </main>
    </AppBackground>
  );
}

