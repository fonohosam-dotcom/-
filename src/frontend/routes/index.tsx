import React, { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
const RootLayout = lazy(() => import('../components/layout/RootLayout'));
const DashboardLayout = lazy(() => import('../components/layout/DashboardLayout'));

// Pages / Portals
const LandingPage = lazy(() => import('../components/portals/LandingPage'));
const CitizenPortal = lazy(() => import('../components/portals/CitizenPortal'));
const DonorPortal = lazy(() => import('../components/portals/DonorPortal'));
const ResearcherPortal = lazy(() => import('../components/portals/ResearcherPortal'));
const MedicalPortal = lazy(() => import('../components/portals/MedicalPortal'));
const AdminPortal = lazy(() => import('../components/portals/AdminPortal'));
const LedgerPortal = lazy(() => import('../components/portals/LedgerPortal'));

// Fallbacks
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );
}

function SectionLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <React.Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>
          
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<React.Suspense fallback={<SectionLoader />}><LandingPage /></React.Suspense>} />
            <Route path="/citizen" element={<React.Suspense fallback={<SectionLoader />}><CitizenPortal /></React.Suspense>} />
            <Route path="/donor" element={<React.Suspense fallback={<SectionLoader />}><DonorPortal /></React.Suspense>} />
            <Route path="/researcher" element={<React.Suspense fallback={<SectionLoader />}><ResearcherPortal /></React.Suspense>} />
            <Route path="/medical" element={<React.Suspense fallback={<SectionLoader />}><MedicalPortal /></React.Suspense>} />
            <Route path="/charity" element={<React.Suspense fallback={<SectionLoader />}><AdminPortal /></React.Suspense>} />
            <Route path="/admin" element={<React.Suspense fallback={<SectionLoader />}><AdminPortal /></React.Suspense>} />
            <Route path="/ledger" element={<React.Suspense fallback={<SectionLoader />}><LedgerPortal /></React.Suspense>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

        </Route>
      </Routes>
    </React.Suspense>
  );
}
