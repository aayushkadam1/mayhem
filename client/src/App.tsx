import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './hooks/useGameState';
import PublicDisplay from './pages/PublicDisplay';
import TeamLogin from './pages/TeamLogin';
import TeamDashboard from './pages/TeamDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function AppRoutes() {
  const { teamAuth, adminToken } = useAuth();

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
