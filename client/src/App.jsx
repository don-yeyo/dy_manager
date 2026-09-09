import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './config/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminApps } from './pages/AdminApps';
import { AdminUsersGroups } from './pages/AdminUsersGroups';
import { AuditLog } from './pages/AuditLog';
import { StatsDashboard } from './pages/StatsDashboard';
import { DbConnectionGuard } from './components/DbConnectionGuard';
import { RefreshCw } from 'lucide-react';

// Guard de Autenticación
const ProtectedRoute = ({ children, withLayout = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={36} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!withLayout) {
    return children;
  }

  return <Layout>{children}</Layout>;
};

// Guard de Administrador
const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <RefreshCw size={36} className="animate-spin" color="var(--primary)" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      {/* Detector y guardia de pérdida de conexión a base de datos */}
      <DbConnectionGuard />

      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

        {/* Rutas de Usuario */}
        <Route
          path="/"
          element={
            <ProtectedRoute withLayout={false}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Rutas de Administrador */}
        <Route
          path="/admin/apps"
          element={
            <AdminRoute>
              <AdminApps />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminUsersGroups />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/audit"
          element={
            <AdminRoute>
              <AuditLog />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <AdminRoute>
              <StatsDashboard />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
