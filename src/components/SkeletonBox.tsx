import React, { useEffect } from 'react';
import { colors } from '../theme/colors';

const STYLE_ID = 'skeleton-box-keyframes';

function ensureKeyframes() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
@keyframes skeletonShimmer {
  0%   { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
}`;
  document.head.appendChild(style);
}

interface SkeletonBoxProps {
  width?: number;
  height?: number;
  borderRadius?: number;
}

export function SkeletonBox({ width = 72, height = 13, borderRadius = 4 }: SkeletonBoxProps) {
  useEffect(() => {
    ensureKeyframes();
  }, []);

  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius,
        background: `linear-gradient(90deg, ${colors.border} 0px, ${colors.surfaceWarm} 40px, ${colors.border} 80px)`,
        backgroundSize: '200px 100%',
        animation: 'skeletonShimmer 1.4s ease-in-out infinite',
        verticalAlign: 'middle',
      }}
    />
  );
}
