import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import { AuditErrorReporter } from './components/audit/AuditErrorReporter';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

export function AppShell() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AuditErrorReporter>
            <App />
          </AuditErrorReporter>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
