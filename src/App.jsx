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
import Settings from './pages/Settings';
import UserManual from './pages/UserManual';
import MapsCoverage from './pages/MapsCoverage';
import ExportsMigration from './pages/ExportsMigration';
import MainDB from './pages/MainDB';
import CoverageTable from './pages/CoverageTable';
import PortalHome               from './pages/portal/PortalHome';
import PortalTargets            from './pages/portal/PortalTargets';
import PortalServiceOffer       from './pages/portal/PortalServiceOffer';
import PortalCompleteness       from './pages/portal/PortalCompleteness';
import PortalMissingReports     from './pages/portal/PortalMissingReports';
import PortalCompletenessTimeliness from './pages/portal/PortalCompletenessTimeliness';
import PortalServiceOfferECDF   from './pages/portal/PortalServiceOfferECDF';
import PortalCompletenessVars   from './pages/portal/PortalCompletenessVars';
import PortalAntigenFollowup    from './pages/portal/PortalAntigenFollowup';
import PortalCommunication      from './pages/portal/PortalCommunication';
import PortalSessionPlanning    from './pages/portal/PortalSessionPlanning';
import PortalVaccinatedChildren from './pages/portal/PortalVaccinatedChildren';
import PortalVCAntigens          from './pages/portal/PortalVCAntigens';
import PortalAnnualComparison    from './pages/portal/PortalAnnualComparison';
import PortalVaccinationEquity   from './pages/portal/PortalVaccinationEquity';
import PortalConsistency         from './pages/portal/PortalConsistency';
import PortalConsistencyOU       from './pages/portal/PortalConsistencyOU';
import PortalVaccinationStrategy from './pages/portal/PortalVaccinationStrategy';
import PortalVaccineChildren     from './pages/portal/PortalVaccineChildren';
import PortalMonitoringLookup    from './pages/portal/PortalMonitoringLookup';
import PortalPDVCurve            from './pages/portal/PortalPDVCurve';
import PortalPDVSearch           from './pages/portal/PortalPDVSearch';
import PortalCoverage           from './pages/portal/PortalCoverage';

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
          <Route path="/UserManual" element={<UserManual />} />
          <Route path="/Settings" element={<Settings />} />

          {/* Historical / analysis routes */}
          <Route path="/MainDB" element={<MainDB />} />
          <Route path="/MapsCoverage" element={<MapsCoverage />} />
          <Route path="/ExportsMigration" element={<ExportsMigration />} />
          <Route path="/CoverageTable" element={<CoverageTable />} />

          {/* ── Vaccination Portal sub-pages (inside AppLayout) ── */}
          <Route path="/Portal/home"                    element={<PortalHome />} />
          <Route path="/Portal/targets"                 element={<PortalTargets />} />
          <Route path="/Portal/service-offer"           element={<PortalServiceOffer />} />
          <Route path="/Portal/completeness"            element={<PortalCompleteness />} />
          <Route path="/Portal/missing-reports"         element={<PortalMissingReports />} />
          <Route path="/Portal/completeness-timeliness" element={<PortalCompletenessTimeliness />} />
          <Route path="/Portal/service-offer-ecdf"      element={<PortalServiceOfferECDF />} />
          <Route path="/Portal/completeness-vars"       element={<PortalCompletenessVars />} />
          <Route path="/Portal/antigen-followup"        element={<PortalAntigenFollowup />} />
          <Route path="/Portal/communication"           element={<PortalCommunication />} />
          <Route path="/Portal/session-planning"        element={<PortalSessionPlanning />} />
          <Route path="/Portal/vaccinated-children"     element={<PortalVaccinatedChildren />} />
          <Route path="/Portal/coverage"                element={<PortalCoverage />} />
          <Route path="/Portal/vc-antigens"              element={<PortalVCAntigens />} />
          <Route path="/Portal/annual-comparison"        element={<PortalAnnualComparison />} />
          <Route path="/Portal/equity"                   element={<PortalVaccinationEquity />} />
          <Route path="/Portal/consistency"              element={<PortalConsistency />} />
          <Route path="/Portal/consistency-ou"           element={<PortalConsistencyOU />} />
          <Route path="/Portal/vaccination-strategy"     element={<PortalVaccinationStrategy />} />
          <Route path="/Portal/vaccine-children"         element={<PortalVaccineChildren />} />
          <Route path="/Portal/monitoring-lookup"        element={<PortalMonitoringLookup />} />
          <Route path="/Portal/pdv-curve"                element={<PortalPDVCurve />} />
          <Route path="/Portal/pdv-search"               element={<PortalPDVSearch />} />
          <Route path="/Portal" element={<Navigate to="/Portal/home" replace />} />

          {/* Redirect removed routes to sensible replacements */}
          <Route path="/Reports" element={<Navigate to="/ExportsMigration" replace />} />
          <Route path="/Analytics" element={<Navigate to="/MapsCoverage" replace />} />
          <Route path="/OneTimeIndicators" element={<Navigate to="/Dashboard" replace />} />
          <Route path="/HistoryDB" element={<Navigate to="/MainDB" replace />} />
          <Route path="/AggregatedDashboard" element={<Navigate to="/Dashboard" replace />} />
          <Route path="/main-db" element={<Navigate to="/MainDB" replace />} />
          <Route path="/history" element={<Navigate to="/MainDB" replace />} />

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
        <Router basename="/verhus-app" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
