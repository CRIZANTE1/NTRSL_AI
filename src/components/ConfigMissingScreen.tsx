import React from 'react';
import { colors } from '../theme/colors';

export function ConfigMissingScreen() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center p-6 text-center"
      style={{ background: colors.background, color: colors.textPrimary }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-6 shadow-sm text-left"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <h1 className="text-xl font-bold mb-2">Configuração ausente</h1>
        <p className="mb-4" style={{ color: colors.textSecondary }}>
          O app não encontrou as variáveis do Supabase no build. Sem elas, a
          autenticação e os dados não carregam.
        </p>
        <ol className="list-decimal list-inside space-y-2 text-sm" style={{ color: colors.textSecondary }}>
          <li>Copie <code className="text-xs">.env.example</code> para <code className="text-xs">.env.local</code></li>
          <li>Preencha <code className="text-xs">VITE_SUPABASE_ANON_KEY</code> no Dashboard Supabase</li>
          <li>Execute <code className="text-xs">npm run cap:sync</code> e reinstale o app</li>
        </ol>
      </div>
    </div>
  );
}
