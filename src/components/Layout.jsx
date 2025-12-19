/**
 * Layout Principal
 * 
 * Estructura de la aplicación con sidebar y header.
 * Muestra información del usuario y navegación.
 */

import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, Activity, History, Building2, 
  Snowflake, Users, LogOut, Menu, X, BarChart3 
} from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Análisis Ejecutivo', href: '/ejecutivo', icon: BarChart3 },
    { name: 'Tiempo Real', href: '/realtime', icon: Activity },
    { name: 'Histórico', href: '/historico', icon: History },
    ...(isAdmin ? [
      { name: 'Sucursales', href: '/sucursales', icon: Building2 },
      { name: 'Cámaras', href: '/camaras', icon: Snowflake },
      { name: 'Usuarios', href: '/usuarios', icon: Users },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 border-r border-gray-700 transition-all duration-300`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {sidebarOpen && <h1 className="text-xl font-bold text-primary-400">ColdTrack</h1>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-700 rounded">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-700">
            {sidebarOpen && (
              <div className="mb-3">
                <p className="text-sm font-medium">{user?.nombre}</p>
                <p className="text-xs text-gray-400">{user?.rol}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="flex items-center gap-3 w-full px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              {sidebarOpen && <span>Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              {navigation.find(item => item.href === location.pathname)?.name || 'ColdTrack'}
            </h2>
            <div className="text-sm text-gray-400">
              {user?.sucursal_id && `Sucursal ID: ${user.sucursal_id}`}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
