import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutGrid, SlidersHorizontal, Sparkles } from 'lucide-react';
import { AppBackground } from '../components/AppBackground';
import { colors } from '../theme/colors';

type UiDensity = 'confortavel' | 'compacta';

function getUiDensity(): UiDensity {
  try {
    return window.localStorage.getItem('ntrsl_ui_compact') === '1' ? 'compacta' : 'confortavel';
  } catch {
    return 'confortavel';
  }
}

function setUiDensity(next: UiDensity) {
  try {
    window.localStorage.setItem('ntrsl_ui_compact', next === 'compacta' ? '1' : '0');
  } catch {
    // ignore
  }
}

export default function PersonalizationPage() {
  const navigate = useNavigate();
  const [density, setDensity] = useState<UiDensity>('confortavel');

  useEffect(() => {
    setDensity(getUiDensity());
  }, []);

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
              Personalização
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Ajustes de interface para este dispositivo.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase ml-1" style={{ color: colors.textSecondary }}>
            Interface
          </h3>

          <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <SlidersHorizontal className="w-5 h-5" style={{ color: colors.accent }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Densidade
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Deixa alguns espaços e cartões mais compactos.
                </p>
              </div>
            </div>

            <div className="p-4 border-t" style={{ borderColor: colors.border }}>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setUiDensity('confortavel');
                    setDensity('confortavel');
                  }}
                  className="rounded-xl px-4 py-3 text-sm font-semibold border"
                  style={{
                    background: density === 'confortavel' ? colors.surfaceWarm : colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                >
                  Confortável
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUiDensity('compacta');
                    setDensity('compacta');
                  }}
                  className="rounded-xl px-4 py-3 text-sm font-semibold border"
                  style={{
                    background: density === 'compacta' ? colors.surfaceWarm : colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                >
                  Compacta
                </button>
              </div>

              <p className="text-xs mt-2 text-center" style={{ color: colors.textSecondary }}>
                Algumas telas podem não aplicar este ajuste ainda.
              </p>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <LayoutGrid className="w-5 h-5" style={{ color: colors.textPrimary }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Layouts (em breve)
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Vamos adicionar opções para ajustar cartões e listagens.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl shadow-sm border overflow-hidden" style={{ background: colors.surface, borderColor: colors.border }}>
            <div className="p-4 flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Sparkles className="w-5 h-5" style={{ color: colors.points }} />
              </div>
              <div className="min-w-0">
                <p className="font-medium" style={{ color: colors.textPrimary }}>
                  Experimentos (em breve)
                </p>
                <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
                  Recursos opcionais para testar antes de sair para todos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppBackground>
  );
}

