import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, ChevronRight, Moon, Paintbrush, RefreshCw, Shield, Sun, Target } from 'lucide-react';
import { AppBackground } from '../components/AppBackground';
import { clearThemePreference, getTheme, setTheme, type AppTheme } from '../lib/theme';
import { useUserGoals } from '../hooks/useUserGoals';
import { colors } from '../theme/colors';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [theme, setThemeState] = useState<AppTheme>('light');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { goals, updateGoals, isUpdating } = useUserGoals();
  const [kcal, setKcal] = useState(String(goals.kcal));
  const [proteina, setProteina] = useState(String(goals.proteina));
  const [carbs, setCarbs] = useState(String(goals.carbs));
  const [goalsSaved, setGoalsSaved] = useState(false);

  const primaryGradient = useMemo(
    () => `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientMid}, ${colors.gradientEnd})`,
    [],
  );

  useEffect(() => {
    const current = getTheme();
    setThemeState(current);
    setTheme(current);
  }, []);

  useEffect(() => {
    setKcal(String(goals.kcal));
    setProteina(String(goals.proteina));
    setCarbs(String(goals.carbs));
  }, [goals.kcal, goals.proteina, goals.carbs]);

  const handleSaveGoals = async () => {
    try {
      await updateGoals({
        kcal: Math.max(500, Number(kcal) || 2000),
        proteina: Math.max(10, Number(proteina) || 50),
        carbs: Math.max(10, Number(carbs) || 250),
      });
      setGoalsSaved(true);
      setTimeout(() => setGoalsSaved(false), 2500);
    } catch {
      // mantém valores atuais
    }
  };

  const handleToggleTheme = () => {
    const next: AppTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    setTheme(next);
  };

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
              Configurações gerais
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Preferências do app e privacidade.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase ml-1" style={{ color: colors.textSecondary }}>
            Aparência
          </h3>

          <div
            className="rounded-2xl shadow-sm border overflow-hidden"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <button
              type="button"
              onClick={handleToggleTheme}
              className="w-full p-4 flex items-center justify-between gap-4 transition-colors"
              style={{ background: colors.surface }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{ background: colors.surfaceWarm, borderColor: colors.border }}
                >
                  {theme === 'light' ? (
                    <Sun className="w-5 h-5" style={{ color: colors.textPrimary }} />
                  ) : (
                    <Moon className="w-5 h-5" style={{ color: colors.textPrimary }} />
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                    Tema
                  </p>
                  <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                    {theme === 'light' ? 'Claro' : 'Escuro'}
                  </p>
                </div>
              </div>

              <div className="w-12 h-6 rounded-full relative shrink-0" style={{ background: colors.textPrimary }}>
                <div
                  className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                  style={{
                    background: colors.surface,
                    left: theme === 'light' ? 'calc(100% - 1.25rem)' : '0.25rem',
                  }}
                />
              </div>
            </button>

            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <button
                type="button"
                onClick={() => {
                  clearThemePreference();
                  const current = getTheme();
                  setThemeState(current);
                  setTheme(current);
                }}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
                style={{ background: primaryGradient, color: colors.textPrimary }}
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar padrão de tema
              </button>
              <p className="text-xs mt-2 text-center" style={{ color: colors.textSecondary }}>
                Isso remove sua preferência salva neste dispositivo.
              </p>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase ml-1 mt-6" style={{ color: colors.textSecondary }}>
            Metas diárias
          </h3>

          <div
            className="rounded-2xl shadow-sm border overflow-hidden"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <div className="p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Target className="w-5 h-5" style={{ color: colors.points }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Metas nutricionais
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Usadas nos anéis de progresso e no resumo do dia.
                </p>
              </div>
            </div>

            <div className="p-4 border-t space-y-3" style={{ borderColor: colors.border }}>
              <label className="block">
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Calorias (kcal/dia)
                </span>
                <input
                  type="number"
                  min={500}
                  max={10000}
                  value={kcal}
                  onChange={(e) => setKcal(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                  style={{
                    background: colors.surfaceWarm,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Proteína (g/dia)
                </span>
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={proteina}
                  onChange={(e) => setProteina(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                  style={{
                    background: colors.surfaceWarm,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                  Carboidratos (g/dia)
                </span>
                <input
                  type="number"
                  min={10}
                  max={1000}
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  className="mt-1 w-full rounded-xl border px-3 py-2.5 text-sm"
                  style={{
                    background: colors.surfaceWarm,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                />
              </label>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => void handleSaveGoals()}
                className="w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                style={{ background: colors.accent, color: colors.textPrimary }}
              >
                {isUpdating ? 'Salvando…' : goalsSaved ? 'Metas salvas ✓' : 'Salvar metas'}
              </button>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase ml-1 mt-6" style={{ color: colors.textSecondary }}>
            Notificações
          </h3>

          <div
            className="rounded-2xl shadow-sm border overflow-hidden"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{ background: colors.surfaceWarm, borderColor: colors.border }}
                >
                  <Bell className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                    Avisos no app
                  </p>
                  <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                    Controla alertas visuais dentro do app.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setNotificationsEnabled((v) => !v)}
                className="w-12 h-6 rounded-full relative shrink-0 border"
                style={{
                  background: notificationsEnabled ? colors.points : colors.surfaceWarm,
                  borderColor: colors.border,
                }}
                aria-pressed={notificationsEnabled}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                  style={{
                    background: colors.surface,
                    left: notificationsEnabled ? 'calc(100% - 1.25rem)' : '0.25rem',
                  }}
                />
              </button>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase ml-1 mt-6" style={{ color: colors.textSecondary }}>
            Privacidade &amp; segurança
          </h3>

          <div
            className="rounded-2xl shadow-sm border divide-y overflow-hidden"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <button
              type="button"
              onClick={() => navigate('/settings/privacy')}
              className="w-full p-4 flex items-center justify-between gap-3 transition-colors"
              style={{ background: colors.surface }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{ background: colors.surfaceWarm, borderColor: colors.border }}
                >
                  <Shield className="w-5 h-5" style={{ color: colors.textPrimary }} />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                    Preferências de privacidade
                  </p>
                  <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                    Gerencie dados locais e permissões.
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
            </button>

            <button
              type="button"
              onClick={() => navigate('/settings/personalizacao')}
              className="w-full p-4 flex items-center justify-between gap-3 transition-colors"
              style={{ background: colors.surface }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{ background: colors.surfaceWarm, borderColor: colors.border }}
                >
                  <Paintbrush className="w-5 h-5" style={{ color: colors.accent }} />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                    Personalização
                  </p>
                  <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                    Ajuste itens de UI (em breve).
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
            </button>
          </div>
        </div>
      </main>
    </AppBackground>
  );
}

