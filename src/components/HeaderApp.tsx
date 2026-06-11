import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../lib/avatar';
import { colors } from '../theme/colors';
import { HEADER_SPACER_CLASS, HEADER_TOP_CLASS } from '../lib/layout';
import { makeGlassSurfaceStyle } from '../theme/glass';

export function HeaderApp() {
  const { profile, avatarUrl } = useAuth();
  const firstName =
    profile?.display_name?.split(/\s+/)[0] ??
    profile?.email?.split('@')[0] ??
    'Você';
  const initials = getInitials(profile?.display_name ?? null, profile?.email ?? null);

  return (
    <>
      <div className={HEADER_SPACER_CLASS} />
      <header className={`fixed ${HEADER_TOP_CLASS} left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40`}>
        <div
          className="rounded-[28px] border px-4 py-3"
          style={{
            ...makeGlassSurfaceStyle(0.45, { blurPx: 10, shadow: 'soft' }),
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.textMuted }}>
                NTRSL AI
              </p>
              <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                Olá, <span className="font-medium" style={{ color: colors.textPrimary }}>{firstName}</span>
              </p>
            </div>
            <Link
              to="/profile"
              className="w-11 h-11 rounded-full overflow-hidden border shadow-sm block shrink-0"
              style={{ background: colors.surface, borderColor: colors.border }}
              aria-label="Perfil"
              title="Perfil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: colors.surface, color: colors.textPrimary }}
                >
                  {initials}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
