import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { colors } from '../theme/colors';

interface CooldownBannerProps {
  remainingSeconds: number;
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CooldownBanner({ remainingSeconds }: CooldownBannerProps) {
  const [seconds, setSeconds] = useState(remainingSeconds);

  useEffect(() => {
    setSeconds(remainingSeconds);
  }, [remainingSeconds]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = window.setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [seconds]);

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
