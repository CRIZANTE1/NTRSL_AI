import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Fingerprint } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm, SmokeyBackground } from '../components/ui/login-form';
import { colors } from '../theme/colors';
import { hapticsSuccess, hapticsError } from '../lib/haptics';
import { soundError, soundSuccess } from '../lib/sounds';
import {
  authenticateAndGetCredentials,
  getBiometricLoginEnabled,
  getRememberEmailEnabled,
  getRememberedEmail,
  isBiometricLoginAvailable,
  saveLoginCredentials,
  saveRememberedEmail,
  setBiometricLoginEnabled,
  setRememberEmailEnabled,
} from '../lib/loginCredentials';

export default function LoginPage() {
  const { signInWithPassword, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (session) {
      navigate('/', { replace: true });
    }
  }, [session, navigate]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [remembered, rememberOn, bioOn, bioAvailable] = await Promise.all([
        getRememberedEmail(),
        getRememberEmailEnabled(),
        getBiometricLoginEnabled(),
        isBiometricLoginAvailable(),
      ]);
      if (!alive) return;
      if (remembered) setEmail(remembered);
      setRememberEmail(rememberOn);
      setBiometricLogin(bioOn);
      setShowBiometricButton(bioAvailable);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const completeLogin = async (loginEmail: string, loginPassword: string) => {
    setSubmitting(true);
    const { error: err } = await signInWithPassword(loginEmail, loginPassword);
    setSubmitting(false);
    if (err) {
      const msg = err.message || 'Não foi possível entrar.';
      if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('E-mail ou senha inválidos.');
        void hapticsError();
        void soundError();
        return;
      }
      setError(msg);
      void hapticsError();
      void soundError();
      return;
    }

    if (rememberEmail) {
      await saveRememberedEmail(loginEmail);
    }
    if (biometricLogin && isNative) {
      await saveLoginCredentials(loginEmail, loginPassword);
    }
    void hapticsSuccess();
    void soundSuccess();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }
    if (!password) {
      setError('Informe sua senha.');
      return;
    }
    await completeLogin(email, password);
  };

  const handleBiometricLogin = async () => {
    setError(null);
    setSubmitting(true);
    const creds = await authenticateAndGetCredentials();
    if (!creds) {
      setSubmitting(false);
      setError('Não foi possível autenticar com biometria.');
      void hapticsError();
      void soundError();
      return;
    }
    setEmail(creds.email);
    await completeLogin(creds.email, creds.password);
  };

  const handleRememberEmailChange = async (checked: boolean) => {
    setRememberEmail(checked);
    await setRememberEmailEnabled(checked);
  };

  const handleBiometricLoginChange = async (checked: boolean) => {
    setBiometricLogin(checked);
    await setBiometricLoginEnabled(checked);
    if (checked && isNative && email && password) {
      await saveLoginCredentials(email, password);
    }
    setShowBiometricButton(await isBiometricLoginAvailable());
  };

  return (
    <main className="relative w-full min-h-dvh" style={{ background: colors.background }}>
      <SmokeyBackground className="absolute inset-0" />
      <div className="relative z-10 flex min-h-dvh items-center justify-center w-full p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
        <div className="flex flex-col items-center gap-4 w-full">
          <LoginForm
            email={email}
            password={password}
            submitting={submitting}
            error={error}
            rememberEmail={rememberEmail}
            biometricLogin={biometricLogin}
            showNativeOptions={isNative}
            onChangeEmail={setEmail}
            onChangePassword={setPassword}
            onRememberEmailChange={(v) => void handleRememberEmailChange(v)}
            onBiometricLoginChange={(v) => void handleBiometricLoginChange(v)}
            onSubmit={handleSubmit}
          />
          {showBiometricButton && (
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleBiometricLogin()}
              className="flex items-center gap-2 py-3 px-6 rounded-2xl border font-medium disabled:opacity-60"
              style={{ background: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
            >
              <Fingerprint className="w-5 h-5" style={{ color: colors.accent }} />
              Entrar com biometria
            </button>
          )}
          <Link
            to="/cadastro"
            className="text-sm underline underline-offset-4"
            style={{ color: colors.textPrimary }}
          >
            Não tenho conta. Quero me cadastrar
          </Link>
        </div>
      </div>
    </main>
  );
}
