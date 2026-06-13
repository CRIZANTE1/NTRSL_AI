import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { isAdminRole, type AppRole, type UserProfile } from '../types/profile';

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: Error | null;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null }>;
  signUpWithPassword: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function profileFromSession(sess: Session): UserProfile {
  const meta = sess.user.user_metadata as Record<string, unknown> | undefined;
  const displayName =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    (typeof meta?.display_name === 'string' && meta.display_name) ||
    null;

  return {
    id: sess.user.id,
    email: sess.user.email ?? null,
    display_name: displayName,
    role: 'user',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<Error | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const loadProfile = useCallback(async (sess: Session | null) => {
    if (!sess?.user?.id) {
      setProfile(null);
      setProfileError(null);
      setAvatarUrl(null);
      return;
    }

    setProfileError(null);
    const fallback = profileFromSession(sess);

    try {
      const { data: row, error } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, role, email')
        .eq('id', sess.user.id)
        .maybeSingle();

      if (error) throw error;

      if (!row) {
        await supabase.from('profiles').upsert({
          id: sess.user.id,
          display_name: fallback.display_name,
          email: sess.user.email ?? null,
          role: 'user',
        });
      }

      const meta = sess.user.user_metadata as { avatar_url?: string } | undefined;
      const avatarFromMeta =
        typeof meta?.avatar_url === 'string' && meta.avatar_url.length ? meta.avatar_url : null;

      const role = (row?.role as AppRole | undefined) ?? 'user';
      setProfile({
        id: sess.user.id,
        email: row?.email ?? sess.user.email ?? null,
        display_name: row?.display_name ?? fallback.display_name,
        role,
      });
      setAvatarUrl(row?.avatar_url ?? avatarFromMeta);
    } catch (err) {
      setProfile(fallback);
      setProfileError(err instanceof Error ? err : new Error(String(err)));
      const meta = sess.user.user_metadata as { avatar_url?: string } | undefined;
      const url = typeof meta?.avatar_url === 'string' && meta.avatar_url.length ? meta.avatar_url : null;
      setAvatarUrl(url);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      loadProfile(s).finally(() => {
        if (mounted) setLoading(false);
      });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(true);
      loadProfile(s).finally(() => setLoading(false));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error: error as Error | null };
    },
    [],
  );

  const signUpWithPassword = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: displayName
          ? { data: { full_name: displayName.trim(), display_name: displayName.trim() } }
          : undefined,
      });
      return {
        error: error as Error | null,
        needsEmailConfirmation: !data?.session,
      };
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const isAdmin = isAdminRole(profile?.role);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileError,
      avatarUrl,
      refreshProfile,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      isAdmin,
    }),
    [
      session,
      profile,
      loading,
      profileError,
      avatarUrl,
      refreshProfile,
      signInWithPassword,
      signUpWithPassword,
      signOut,
      isAdmin,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
