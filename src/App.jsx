/**
 * Componente Principal de la Aplicación
 * 
 * Configura el enrutamiento y la estructura general de la app.
 * Incluye rutas protegidas que requieren autenticación.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Páginas
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import DashboardEjecutivo from './pages/ejecutivo/DashboardEjecutivo';
import Realtime from './pages/realtime/Realtime';
import Historico from './pages/historico/Historico';
import Sucursales from './pages/admin/Sucursales';
import Camaras from './pages/admin/Camaras';
import Usuarios from './pages/admin/Usuarios';

// Layout
import Layout from './components/Layout';

// Componente de ruta protegida
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="ejecutivo" element={<DashboardEjecutivo />} />
        <Route path="realtime" element={<Realtime />} />
        <Route path="historico" element={<Historico />} />
        <Route path="sucursales" element={
          <ProtectedRoute adminOnly>
            <Sucursales />
          </ProtectedRoute>
        } />
        <Route path="camaras" element={
          <ProtectedRoute adminOnly>
            <Camaras />
          </ProtectedRoute>
        } />
        <Route path="usuarios" element={
          <ProtectedRoute adminOnly>
            <Usuarios />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
