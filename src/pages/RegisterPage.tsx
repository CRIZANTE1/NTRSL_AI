import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppBackground } from '../components/AppBackground';
import { colors } from '../theme/colors';
import { hapticsSuccess, hapticsError } from '../lib/haptics';
import { soundError, soundSuccess } from '../lib/sounds';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { session, signUpWithPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const primaryGradient = useMemo(
    () => `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientMid}, ${colors.gradientEnd})`,
    [],
  );

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!fullName.trim()) {
      setError('Informe seu nome.');
      return;
    }
    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }
    if (!password) {
      setError('Informe sua senha.');
      return;
    }

    setSubmitting(true);
    const { error: signUpErr, needsEmailConfirmation } = await signUpWithPassword(
      email,
      password,
      fullName,
    );
    setSubmitting(false);

    if (signUpErr) {
      setError(signUpErr.message || 'Não foi possível criar sua conta.');
      void hapticsError();
      void soundError();
      return;
    }

    if (needsEmailConfirmation) {
      setInfo('Conta criada. Verifique seu e-mail para confirmar o cadastro e faça login.');
      void hapticsSuccess();
      void soundSuccess();
      return;
    }

    void hapticsSuccess();
    void soundSuccess();
    navigate('/diario', { replace: true });
  };

  return (
    <AppBackground>
      <div className="flex items-center justify-center w-full min-h-screen p-4">
        <div
          className="w-full max-w-md p-8 space-y-6 rounded-2xl border shadow-sm"
          style={{
            background: colors.surface,
            borderColor: colors.border,
          }}
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold" style={{ color: colors.textPrimary }}>
              Criar conta
            </h2>
            <p className="mt-2 text-sm" style={{ color: colors.textSecondary }}>
              Comece sua jornada de saúde com o NTRSL AI
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm" style={{ color: colors.textSecondary }}>
                Nome
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none border"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                placeholder="Ex.: Maria Silva"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm" style={{ color: colors.textSecondary }}>
                E-mail
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none border"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm" style={{ color: colors.textSecondary }}>
                Senha
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none border"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
                placeholder="Crie uma senha"
              />
            </div>

            {error && (
              <p
                className="text-sm rounded-xl px-3 py-2 border"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.badge,
                  color: colors.textPrimary,
                }}
              >
                {error}
              </p>
            )}

            {info && (
              <p
                className="text-sm rounded-xl px-3 py-2 border"
                style={{
                  background: colors.surfaceWarm,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }}
              >
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 rounded-xl font-semibold border transition-all disabled:opacity-60"
              style={{
                background: primaryGradient,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
            >
              {submitting ? 'Criando…' : 'Criar conta'}
            </button>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl font-semibold border hover:opacity-95 active:scale-[0.99]"
              style={{
                background: colors.surfaceWarm,
                borderColor: colors.border,
                color: colors.textPrimary,
              }}
              onClick={() => navigate('/login')}
            >
              Já tenho conta
            </button>
          </form>
        </div>
      </div>
    </AppBackground>
  );
}
