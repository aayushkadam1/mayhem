import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useGameState';
import PublicDisplay from './pages/PublicDisplay';
import TeamLogin from './pages/TeamLogin';
import TeamDashboard from './pages/TeamDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PrimeLogin from './pages/PrimeLogin';
import PrimeDashboard from './pages/PrimeDashboard';
import JudgeLogin from './pages/JudgeLogin';
import JudgeDashboard from './pages/JudgeDashboard';

function AppRoutes() {
  const { teamAuth, adminToken, primeAuth, judgeAuth } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<PublicDisplay />} />
      <Route
        path="/team"
        element={
          teamAuth
            ? <TeamDashboard />
            : <TeamLogin onLogin={() => {}} />
        }
      />
      <Route
        path="/admin"
        element={
          adminToken
            ? <AdminDashboard />
            : <AdminLogin onLogin={() => {}} />
        }
      />
      <Route
        path="/prime"
        element={
          primeAuth
            ? <PrimeDashboard />
            : <PrimeLogin onLogin={() => {}} />
        }
      />
      <Route
        path="/judge"
        element={
          judgeAuth
            ? <JudgeDashboard />
            : <JudgeLogin onLogin={() => {}} />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
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
