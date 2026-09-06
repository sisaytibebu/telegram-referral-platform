import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import HealthCheck from './pages/HealthCheck';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Referrals from './pages/Referrals';
import Transactions from './pages/Transactions';
import Withdrawals from './pages/Withdrawals';
import Requirements from './pages/Requirements';
import Settings from './pages/Settings';
import AuditLogs from './pages/AuditLogs';

// Protect admin routes
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"       element={<HealthCheck />} />
      <Route path="/login"  element={<Login />} />

      {/* Protected admin routes */}
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="dashboard"    element={<Dashboard />} />
        <Route path="users"        element={<Users />} />
        <Route path="referrals"    element={<Referrals />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="withdrawals"  element={<Withdrawals />} />
        <Route path="requirements" element={<Requirements />} />
        <Route path="settings"     element={<Settings />} />
        <Route path="audit-logs"   element={<AuditLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
