import type { CSSProperties } from 'react';
import { colors } from './colors';
import { hexToRgba } from './colorUtils';

export function makeGlassSurfaceStyle(
  alpha: number,
  opts?: { blurPx?: number; shadow?: 'soft' | 'strong' },
): CSSProperties {
  const blurPx = opts?.blurPx ?? 12;
  const shadow =
    opts?.shadow === 'strong'
      ? '0 18px 50px rgba(0, 0, 0, 0.10)'
      : '0 10px 30px rgba(0, 0, 0, 0.06)';

  return {
    borderColor: colors.border,
    background: hexToRgba(colors.surface, alpha),
    backdropFilter: `blur(${blurPx}px)`,
    boxShadow: shadow,
  };
}

