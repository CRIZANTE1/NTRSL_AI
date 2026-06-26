import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigMissingScreen } from './components/ConfigMissingScreen';
import './index.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const root = createRoot(document.getElementById('root')!);

if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
  root.render(
    <StrictMode>
      <ConfigMissingScreen />
    </StrictMode>,
  );
} else {
  void import('./appShell').then(({ AppShell }) => {
    root.render(
      <StrictMode>
        <AppShell />
      </StrictMode>,
    );
  });
}
