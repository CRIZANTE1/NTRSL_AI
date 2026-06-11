import React, { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageSkeleton } from '../components/PageSkeleton';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { RootRedirect } from '../components/routing/RootRedirect';
import { AppLayout } from '../layouts/AppLayout';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const PrivacySettingsPage = lazy(() => import('../pages/PrivacySettingsPage'));
const PersonalizationPage = lazy(() => import('../pages/PersonalizationPage'));
const NutritionHomePage = lazy(() => import('../pages/NutritionHomePage'));
const HistoricoPage = lazy(() => import('../pages/HistoricoPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));

function LazyAuth({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton variant="auth" />}>{children}</Suspense>;
}

function LazyApp({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton variant="default" />}>{children}</Suspense>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LazyAuth>
            <LoginPage />
          </LazyAuth>
        }
      />
      <Route
        path="/cadastro"
        element={
          <LazyAuth>
            <RegisterPage />
          </LazyAuth>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<RootRedirect />} />

        <Route element={<AppLayout />}>
          <Route
            path="/home"
            element={
              <LazyApp>
                <NutritionHomePage />
              </LazyApp>
            }
          />
          <Route
            path="/historico"
            element={
              <LazyApp>
                <HistoricoPage />
              </LazyApp>
            }
          />
          <Route
            path="/sobre"
            element={
              <LazyApp>
                <AboutPage />
              </LazyApp>
            }
          />
        </Route>

        <Route
          path="/profile"
          element={
            <LazyApp>
              <ProfilePage />
            </LazyApp>
          }
        />
        <Route
          path="/settings"
          element={
            <LazyApp>
              <SettingsPage />
            </LazyApp>
          }
        />
        <Route
          path="/settings/privacy"
          element={
            <LazyApp>
              <PrivacySettingsPage />
            </LazyApp>
          }
        />
        <Route
          path="/settings/personalizacao"
          element={
            <LazyApp>
              <PersonalizationPage />
            </LazyApp>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
