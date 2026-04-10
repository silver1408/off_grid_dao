import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingState } from './components/common/LoadingState';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SwapPage = lazy(() => import('./pages/SwapPage'));
const ProposalsPage = lazy(() => import('./pages/ProposalsPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingState label="Loading route..." />}>
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/swap" element={<SwapPage />} />
            <Route path="/proposals" element={<ProposalsPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
