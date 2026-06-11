import React from 'react';
import { ArrowRight, Fingerprint, Lock, User } from 'lucide-react';
import { colors } from '../../theme/colors';
import { makeGlassSurfaceStyle } from '../../theme/glass';
import { Skeleton } from './Skeleton';

export function SmokeyBackground({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 w-full h-full overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 bg-cover bg-bottom bg-no-repeat opacity-50 scale-[1.6]"
        style={{
          backgroundImage:
            'url("https://res.cloudinary.com/drhx7imeb/image/upload/v1756215257/gradient-optimized_nfrakk.svg")',
        }}
      />
    </div>
  );
}

interface LoginFormProps {
  email: string;
  password: string;
  submitting?: boolean;
  error?: string | null;
  rememberEmail?: boolean;
  biometricLogin?: boolean;
  showNativeOptions?: boolean;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onRememberEmailChange?: (value: boolean) => void;
  onBiometricLoginChange?: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function LoginForm({
  email,
  password,
  submitting = false,
  error = null,
  rememberEmail = false,
  biometricLogin = false,
  showNativeOptions = false,
  onChangeEmail,
  onChangePassword,
  onRememberEmailChange,
  onBiometricLoginChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <div
      className="w-full max-w-sm p-8 space-y-6 rounded-2xl border"
      style={{
        ...makeGlassSurfaceStyle(0.72, { blurPx: 14, shadow: 'strong' }),
      }}
    >
      <div className="text-center">
        <h2 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
          NTRSL AI
        </h2>
        <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
          Seu companheiro inteligente de saúde e bem-estar
        </p>
      </div>

      <form className="space-y-8" onSubmit={onSubmit}>
        <div className="relative z-0">
          <input
            type="email"
            id="floating_email"
            autoComplete="email"
            value={email}
            onChange={(e) => onChangeEmail(e.target.value)}
            className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer"
            style={{
              color: colors.textPrimary,
              borderBottomColor: colors.border,
            }}
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_email"
            className="absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            style={{ color: colors.textMuted }}
          >
            <User className="inline-block mr-2 -mt-1" size={16} style={{ color: colors.iconInactive }} />
            E-mail
          </label>
        </div>

        <div className="relative z-0">
          <input
            type="password"
            id="floating_password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            className="block py-2.5 px-0 w-full text-sm bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 peer"
            style={{
              color: colors.textPrimary,
              borderBottomColor: colors.border,
            }}
            placeholder=" "
            required
          />
          <label
            htmlFor="floating_password"
            className="absolute text-sm duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
            style={{ color: colors.textMuted }}
          >
            <Lock className="inline-block mr-2 -mt-1" size={16} style={{ color: colors.iconInactive }} />
            Senha
          </label>
        </div>

        {showNativeOptions && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => onRememberEmailChange?.(e.target.checked)}
                className="h-4 w-4 rounded border"
                style={{ accentColor: colors.accent }}
              />
              <span className="text-sm" style={{ color: colors.textSecondary }}>
                Lembrar e-mail
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={biometricLogin}
                onChange={(e) => onBiometricLoginChange?.(e.target.checked)}
                className="h-4 w-4 rounded border"
                style={{ accentColor: colors.accent }}
              />
              <span className="text-sm inline-flex items-center gap-1.5" style={{ color: colors.textSecondary }}>
                <Fingerprint className="w-4 h-4" style={{ color: colors.accent }} />
                Usar biometria para entrar
              </span>
            </label>
          </div>
        )}

        {error && (
          <p
            className="text-sm rounded-xl px-3 py-2 border"
            style={{
              background: colors.surfaceWarm,
              borderColor: colors.border,
              color: colors.badge,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group w-full flex items-center justify-center py-3 px-4 disabled:opacity-60 rounded-lg font-semibold transition-all duration-300 hover:brightness-95 active:brightness-90"
          style={{ background: colors.accent, color: colors.textPrimary }}
        >
          {submitting ? (
            <Skeleton
              className="h-4 w-24 rounded"
              style={{ background: colors.accentSoft, borderColor: 'transparent' }}
            />
          ) : (
            <>
              Entrar
              <ArrowRight
                className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform"
                style={{ color: colors.textPrimary }}
              />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

