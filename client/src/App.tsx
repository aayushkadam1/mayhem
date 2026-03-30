import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useGameState';
import Landing from './pages/Landing';
import PublicDisplay from './pages/PublicDisplay';
import TeamLogin from './pages/TeamLogin';
import TeamDashboard from './pages/TeamDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PrimeLogin from './pages/PrimeLogin.tsx';
import PrimeDashboard from './pages/PrimeDashboard.tsx';
import JudgeLogin from './pages/JudgeLogin.tsx';
import JudgeDashboard from './pages/JudgeDashboard.tsx';
import { ROUTES } from './navigation';

function AppRoutes() {
  const { teamAuth, adminToken, primeAuth, judgeAuth } = useAuth();

  return (
    <Routes>
      <Route path={ROUTES.landing} element={<Landing />} />
      <Route path={ROUTES.display} element={<PublicDisplay />} />
      <Route
        path={ROUTES.team}
        element={
          teamAuth
            ? <TeamDashboard />
            : <TeamLogin onLogin={() => {}} />
        }
      />
      <Route
        path={ROUTES.admin}
        element={
          adminToken
            ? <AdminDashboard />
            : <AdminLogin onLogin={() => {}} />
        }
      />
      <Route
        path={ROUTES.prime}
        element={
          primeAuth
            ? <PrimeDashboard />
            : <PrimeLogin onLogin={() => {}} />
        }
      />
      <Route
        path={ROUTES.judge}
        element={
          judgeAuth
            ? <JudgeDashboard />
            : <JudgeLogin onLogin={() => {}} />
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
