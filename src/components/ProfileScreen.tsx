import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Camera,
  ChevronRight,
  LogOut,
  Moon,
  Settings,
  Shield,
  Sun,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getInitials } from '../lib/avatar';
import { getTheme, setTheme } from '../lib/theme';
import ProfileSkeleton from './ProfileSkeleton';
import { colors } from '../theme/colors';
import { logger } from '../lib/logger';

function getPublicAvatarUrl(path: string) {
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { session, profile, loading, profileError, signOut, avatarUrl, refreshProfile } = useAuth();
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const primaryGradient = `linear-gradient(135deg, ${colors.gradientStart}, ${colors.gradientMid}, ${colors.gradientEnd})`;

  useEffect(() => {
    setThemeState(getTheme());
    setTheme(getTheme());
  }, []);

  useEffect(() => {
    if (!avatarUrl) {
      setLocalAvatarUrl(null);
      return;
    }
    setLocalAvatarUrl(`${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}`);
  }, [avatarUrl]);

  useEffect(() => {
    if (!showUploadMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.avatar-upload-container')) {
        setShowUploadMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUploadMenu]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !session?.user?.id) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Por favor, selecione uma imagem válida.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.alert('A imagem deve ter no máximo 5MB.');
      return;
    }

    setIsUploading(true);
    setShowUploadMenu(false);
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${session.user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const publicUrl = getPublicAvatarUrl(path);
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });
      if (updateError) throw updateError;

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      setLocalAvatarUrl(`${publicUrl}${publicUrl.includes('?') ? '&' : '?'}v=${Date.now()}`);
      setAvatarError(false);
      await refreshProfile();
    } catch (err: unknown) {
      logger.error('ProfileScreen', 'Erro ao fazer upload do avatar', err);
      window.alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setThemeState(next);
    setTheme(next);
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Deseja sair da conta?');
    if (!confirmed) return;
    setIsLoggingOut(true);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (loading) return <ProfileSkeleton />;

  if (profileError || !profile) {
    return (
      <div className="flex-1 px-6 pt-24 pb-24 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4" style={{ color: colors.textSecondary }}>
            Não foi possível carregar o perfil
          </p>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-2xl font-semibold hover:brightness-95 active:brightness-90"
            style={{ background: colors.accent, color: colors.textPrimary }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const displayEmail = session?.user?.email ?? profile.email ?? '';
  const displayName = profile.display_name || 'Usuário';
  const initials = getInitials(profile.display_name ?? null, displayEmail ?? null);

  return (
    <div className="flex-1 pb-32">
      <div
        className="rounded-b-[32px] px-6 pt-6 pb-5 text-center shadow-sm border-b"
        style={{ background: colors.surface, borderColor: colors.border }}
      >
        <div className="relative mx-auto mb-2 w-fit avatar-upload-container shrink-0">
          <div
            className="rounded-full p-0.5 flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90 relative"
            style={{
              background: primaryGradient,
              width: 64,
              height: 64,
              aspectRatio: '1 / 1',
              borderRadius: 9999,
              overflow: 'hidden',
            }}
            onClick={() => {
              if (!isUploading) setShowUploadMenu((v) => !v);
            }}
          >
            <div
              className="w-full h-full flex items-center justify-center overflow-hidden"
              style={{ background: colors.surface, borderRadius: 9999 }}
            >
              {localAvatarUrl && !avatarError ? (
                <img
                  src={localAvatarUrl}
                  alt="Perfil"
                  className="block w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-base font-bold"
                  style={{ color: colors.textPrimary }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>

          {showUploadMenu && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-1 rounded-xl shadow-2xl z-50 min-w-[150px] border overflow-hidden"
              style={{ background: colors.surface, borderColor: colors.border }}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 text-left text-xs transition-all flex items-center gap-2 hover:brightness-95 active:brightness-90"
                style={{ color: colors.textPrimary }}
              >
                <Camera className="w-4 h-4" style={{ color: colors.accent }} />
                Alterar foto
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        <h2 className="text-base font-bold leading-tight" style={{ color: colors.textPrimary }}>
          {displayName}
        </h2>
        <p className="text-[11px] mb-4" style={{ color: colors.textSecondary }}>
          {displayEmail}
        </p>
      </div>

      <div className="p-6 space-y-3">
        <h3 className="text-xs font-bold uppercase ml-1 mb-2 mt-4" style={{ color: colors.textSecondary }}>
          Preferências
        </h3>

        <div
          className="rounded-3xl overflow-hidden shadow-sm border"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: colors.border }}>
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl border"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Bell className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Notificações
              </span>
            </div>
            <div className="w-12 h-6 rounded-full relative" style={{ background: colors.points }}>
              <div className="absolute right-1 top-1 w-4 h-4 rounded-full shadow-sm" style={{ background: colors.surface }} />
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="w-full p-4 flex items-center justify-between transition-all hover:brightness-95 active:brightness-90"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl border"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                {theme === 'light' ? (
                  <Sun className="w-5 h-5" style={{ color: colors.textSecondary }} />
                ) : (
                  <Moon className="w-5 h-5" style={{ color: colors.textSecondary }} />
                )}
              </div>
              <div className="text-left">
                <span className="text-sm font-medium block" style={{ color: colors.textPrimary }}>
                  Tema
                </span>
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  {theme === 'light' ? 'Claro' : 'Escuro'}
                </span>
              </div>
            </div>
            <div className="w-12 h-6 rounded-full relative" style={{ background: colors.textPrimary }}>
              <div
                className="absolute top-1 w-4 h-4 rounded-full transition-transform"
                style={{ background: colors.surface, left: theme === 'light' ? 'calc(100% - 1.25rem)' : '0.25rem' }}
              />
            </div>
          </button>
        </div>

        <h3 className="text-xs font-bold uppercase ml-1 mb-2 mt-4" style={{ color: colors.textSecondary }}>
          Conta &amp; Segurança
        </h3>

        <div
          className="rounded-3xl overflow-hidden shadow-sm border"
          style={{ background: colors.surface, borderColor: colors.border }}
        >
          <button
            type="button"
            onClick={() => navigate('/settings/privacy')}
            className="w-full p-4 flex items-center justify-between border-b transition-all hover:brightness-95 active:brightness-90"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl border"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Shield className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Privacidade
              </span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: colors.textMuted }} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="w-full p-4 flex items-center justify-between border-b transition-all hover:brightness-95 active:brightness-90"
            style={{ borderColor: colors.border }}
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl border"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <Settings className="w-5 h-5" style={{ color: colors.textSecondary }} />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                Configurações gerais
              </span>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: colors.textMuted }} />
          </button>

          <button
            type="button"
            disabled={isLoggingOut}
            onClick={handleLogout}
            className="w-full p-4 flex items-center justify-between transition-all disabled:opacity-60 hover:brightness-95 active:brightness-90"
          >
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-xl border"
                style={{ background: colors.surfaceWarm, borderColor: colors.border }}
              >
                <LogOut className="w-5 h-5" style={{ color: colors.badge }} />
              </div>
              <span className="text-sm font-medium" style={{ color: colors.badge }}>
                {isLoggingOut ? 'Saindo…' : 'Sair'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
