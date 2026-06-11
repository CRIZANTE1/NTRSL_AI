import React from 'react';
import type { CSSProperties } from 'react';
import { colors } from '../../theme/colors';
import { hexToRgba } from '../../theme/colorUtils';

type SkeletonProps = {
  className?: string;
  style?: CSSProperties;
  /**
   * Cor base e highlight (opcionais). Quando omitidas, usa tokens do Design System.
   * Aceita hex ou rgba.
   */
  baseColor?: string;
  highlightColor?: string;
  borderColor?: string;
  'aria-hidden'?: boolean;
};

export function Skeleton({
  className = '',
  style,
  baseColor,
  highlightColor,
  borderColor,
  'aria-hidden': ariaHidden = true,
}: SkeletonProps) {
  const resolvedBase = baseColor ?? hexToRgba(colors.textPrimary, 0.06);
  const resolvedHighlight = highlightColor ?? hexToRgba(colors.textPrimary, 0.03);
  const resolvedBorder = borderColor ?? colors.border;

  return (
    <div
      aria-hidden={ariaHidden}
      className={`skeleton ${className}`}
      style={{
        ...(style ?? {}),
        borderColor: resolvedBorder,
        // driven by src/index.css
        ['--sk-base' as any]: resolvedBase,
        ['--sk-highlight' as any]: resolvedHighlight,
      }}
    />
  );
}

