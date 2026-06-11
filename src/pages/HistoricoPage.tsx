import React from 'react';
import { CalendarDays } from 'lucide-react';
import { colors } from '../theme/colors';

export default function HistoricoPage() {
  return (
    <div className="pt-4">
      <h1 className="text-2xl font-light" style={{ color: colors.textPrimary }}>
        Histórico
      </h1>
      <p className="text-sm mt-1 mb-6" style={{ color: colors.textSecondary }}>
        Seus registros diários aparecerão aqui quando a persistência no Supabase estiver ativa.
      </p>

      <div
        className="rounded-2xl border p-8 text-center"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <CalendarDays
          className="w-10 h-10 mx-auto mb-3"
          style={{ color: colors.textMuted }}
        />
        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          Nenhum registro salvo ainda
        </p>
        <p className="text-xs mt-2" style={{ color: colors.textSecondary }}>
          Fase 4: sincronização de daily_logs com o backend.
        </p>
      </div>
    </div>
  );
}
