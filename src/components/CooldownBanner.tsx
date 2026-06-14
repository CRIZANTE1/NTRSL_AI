import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { colors } from '../theme/colors';
import { formatCountdown, useCountdown } from '../hooks/useCountdown';

interface CooldownBannerProps {
  remainingSeconds: number;
}

export function CooldownBanner({ remainingSeconds }: CooldownBannerProps) {
  const seconds = useCountdown(remainingSeconds);

  if (seconds <= 0) return null;

  return (
    <div
      className="rounded-2xl border px-4 py-3 flex items-center gap-3"
      style={{ background: colors.surfaceWarm, borderColor: colors.border }}
    >
      <Clock className="w-5 h-5 shrink-0" style={{ color: colors.accent }} />
      <div>
        <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          Aguarde para nova recomendação da IA
        </p>
        <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
          Próxima solicitação em {formatCountdown(seconds)}
        </p>
      </div>
    </div>
  );
}
