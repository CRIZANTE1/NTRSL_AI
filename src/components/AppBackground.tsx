import React from 'react';
import { colors } from '../theme/colors';
import { MAIN_BOTTOM_PADDING_CLASS } from '../lib/layout';

export const AppBackground = ({ children }: { children: React.ReactNode }) => (
  <div
    className="min-h-screen relative overflow-hidden flex justify-center"
    style={{ background: colors.background }}
  >
    <div
      className="absolute top-40 left-10 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"
      style={{ background: colors.gradientStart }}
    />
    <div
      className="absolute top-60 right-10 w-64 h-64 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"
      style={{ background: colors.gradientMid }}
    />
    <div className={`w-full max-w-md bg-transparent relative z-10 flex flex-col min-h-screen ${MAIN_BOTTOM_PADDING_CLASS}`}>
      {children}
    </div>
  </div>
);
