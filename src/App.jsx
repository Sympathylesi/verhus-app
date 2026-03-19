import { useState } from 'react';
import { Toaster } from 'sonner';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ResetPage from './pages/auth/ResetPage';
import PageNotFound from './lib/PageNotFound';

import Dashboard from './pages/Dashboard';
import DataEntry from './pages/DataEntry';
import HealthAreas from './pages/HealthAreas';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import OneTimeIndicators from './pages/OneTimeIndicators';
import Settings from './pages/Settings';
import HistoryDB from './pages/HistoryDB';
import AggregatedDashboard from './pages/AggregatedDashboard';
import MapsCoverage from './pages/MapsCoverage';
import ExportsMigration from './pages/ExportsMigration';
import MainDB from './pages/MainDB';

// ─── Guards ─────────────────────────────────────────────────────────────────
function RequireAuth() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <AppLoader />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireRole({ roles }) {
  const { hasRole } = useAuth();
  const ctx = useOutletContext();
  return hasRole(...roles) ? <Outlet context={ctx} /> : <Navigate to="/Dashboard" replace />;
}

function RedirectIfAuth() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) return <AppLoader />;
  return isAuthenticated ? <Navigate to="/Dashboard" replace /> : <Outlet />;
}

function AppLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading VERHUS…</p>
      </div>
    </div>
  );
}

// ─── Root ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  const [lang, setLang] = useState('en');

  return (
    <Routes>
      {/* Public — redirect to dashboard if already logged in */}
      <Route element={<RedirectIfAuth />}>
        <Route path="/login" element={<LoginPage lang={lang} setLang={setLang} />} />
        <Route path="/register" element={<RegisterPage lang={lang} setLang={setLang} />} />
        <Route path="/reset-password" element={<ResetPage lang={lang} setLang={setLang} />} />
      </Route>

      {/* Protected — all authenticated users */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout lang={lang} setLang={setLang} />}>
          <Route path="/" element={<Navigate to="/Dashboard" replace />} />
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/HealthAreas" element={<HealthAreas />} />
          <Route path="/Reports" element={<Reports />} />
          <Route path="/Analytics" element={<Analytics />} />
          <Route path="/Settings" element={<Settings />} />
          <Route path="/OneTimeIndicators" element={<OneTimeIndicators />} />

          {/* Historical / analysis routes */}
          <Route path="/HistoryDB" element={<HistoryDB />} />
          <Route path="/AggregatedDashboard" element={<AggregatedDashboard />} />
          <Route path="/MapsCoverage" element={<MapsCoverage />} />
          <Route path="/ExportsMigration" element={<ExportsMigration />} />
          <Route path="/MainDB" element={<MainDB />} />
          <Route path="/main-db" element={<MainDB />} />
          <Route path="/history" element={<MainDB />} />

          {/* Collector + Supervisor + Admin */}
          <Route element={<RequireRole roles={['collector', 'supervisor', 'admin']} />}>
            <Route path="/DataEntry" element={<DataEntry />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppRoutes />
        </Router>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
