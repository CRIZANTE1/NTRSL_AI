import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { AppBackground } from '../components/AppBackground';
import { useAuth } from '../contexts/AuthContext';
import { fetchAllProfiles, updateProfileRole } from '../lib/admin/users';
import { colors } from '../theme/colors';
import type { AppRole } from '../types/profile';
import type { Database } from '../types/supabase';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

const ROLE_LABELS: Record<AppRole, string> = {
  user: 'Usuário',
  admin: 'Administrador',
};

export default function AdminPage() {
  const navigate = useNavigate();
  const { profile: currentProfile } = useAuth();
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllProfiles();
      setRows(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRoleChange = async (userId: string, role: AppRole) => {
    if (userId === currentProfile?.id && role !== 'admin') {
      const ok = window.confirm('Remover seu próprio acesso de administrador?');
      if (!ok) return;
    }

    setSavingId(userId);
    setError(null);
    try {
      await updateProfileRole(userId, role);
      setRows((prev) => prev.map((r) => (r.id === userId ? { ...r, role } : r)));
      if (userId === currentProfile?.id) {
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao atualizar role.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AppBackground>
      <main className="flex-1 px-6 pt-6 pb-32">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-2xl px-4 py-3 flex items-center gap-2 border"
            style={{ background: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="min-w-0">
            <h1 className="text-3xl font-light leading-tight" style={{ color: colors.textPrimary }}>
              Administração
            </h1>
            <p className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Gerencie roles dos usuários do app.
            </p>
          </div>
        </div>

        {error && (
          <p
            className="text-sm rounded-xl px-3 py-2 border mb-4"
            style={{ background: colors.surfaceWarm, borderColor: colors.border, color: colors.badge }}
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Carregando usuários…
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                style={{ background: colors.surface, borderColor: colors.border }}
              >
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: colors.textPrimary }}>
                    {row.display_name || 'Sem nome'}
                    {row.id === currentProfile?.id && (
                      <span className="text-xs ml-2" style={{ color: colors.textMuted }}>
                        (você)
                      </span>
                    )}
                  </p>
                  <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
                    {row.email || '—'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Shield className="w-4 h-4" style={{ color: colors.accent }} />
                  <select
                    value={row.role}
                    disabled={savingId === row.id}
                    onChange={(e) => void handleRoleChange(row.id, e.target.value as AppRole)}
                    className="rounded-xl border px-3 py-2 text-sm"
                    style={{
                      background: colors.surfaceWarm,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                    }}
                  >
                    <option value="user">{ROLE_LABELS.user}</option>
                    <option value="admin">{ROLE_LABELS.admin}</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </AppBackground>
  );
}
