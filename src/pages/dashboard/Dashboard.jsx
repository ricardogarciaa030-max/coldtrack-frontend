/**
 * Dashboard Principal
 * 
 * Muestra KPIs, gráficos y eventos recientes.
 * Consume datos del backend Django.
 */

import React, { useState, useEffect } from 'react';
import { getKPIs, getEventosPorDia, getEventosRecientes } from '../../services/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, Building2, Snowflake } from 'lucide-react';

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [eventosPorDia, setEventosPorDia] = useState([]);
  const [eventosRecientes, setEventosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [kpisRes, eventosRes, recientesRes] = await Promise.all([
        getKPIs(),
        getEventosPorDia(),
        getEventosRecientes()
      ]);
      
      setKpis(kpisRes.data);
      setEventosPorDia(eventosRes.data);
      setEventosRecientes(recientesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">
      <div className="text-xl">Cargando...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Cámaras Activas</p>
              <p className="text-3xl font-bold mt-2">{kpis?.camaras_activas || 0}</p>
            </div>
            <Snowflake className="text-primary-400" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sucursales Activas</p>
              <p className="text-3xl font-bold mt-2">{kpis?.sucursales_activas || 0}</p>
            </div>
            <Building2 className="text-green-400" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Eventos Hoy</p>
              <p className="text-3xl font-bold mt-2">{kpis?.eventos_hoy || 0}</p>
            </div>
            <AlertTriangle className="text-yellow-400" size={40} />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Cámaras con Eventos (24h)</p>
              <p className="text-3xl font-bold mt-2">{kpis?.camaras_con_eventos_24h || 0}</p>
            </div>
            <Activity className="text-red-400" size={40} />
          </div>
        </div>
      </div>

      {/* Gráfico de eventos por día */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Eventos por Día (Últimos 7 días)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={eventosPorDia}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="fecha" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
            <Bar dataKey="total" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Eventos recientes */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Eventos Recientes</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">Tipo</th>
                <th className="text-left py-3 px-4">Cámara</th>
                <th className="text-left py-3 px-4">Sucursal</th>
                <th className="text-left py-3 px-4">Fecha</th>
                <th className="text-left py-3 px-4">Temp. Máx</th>
                <th className="text-left py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {eventosRecientes.map((evento) => (
                <tr key={evento.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-4">{evento.tipo}</td>
                  <td className="py-3 px-4">{evento.camara.nombre}</td>
                  <td className="py-3 px-4">{evento.sucursal.nombre}</td>
                  <td className="py-3 px-4">{new Date(evento.fecha_inicio).toLocaleString()}</td>
                  <td className="py-3 px-4">{evento.temp_max_c}°C</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      evento.estado === 'RESUELTO' ? 'bg-green-900 text-green-300' :
                      evento.estado === 'EN_CURSO' ? 'bg-yellow-900 text-yellow-300' :
                      'bg-blue-900 text-blue-300'
                    }`}>
                      {evento.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
