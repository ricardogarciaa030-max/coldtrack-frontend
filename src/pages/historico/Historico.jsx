/**
 * Página de Histórico
 * Consulta y visualiza datos históricos de temperatura y eventos
 */

import React, { useState, useEffect } from 'react';
import { getEventos, getCamaras, getSucursalesActivas } from '../../services/api';
import { Download } from 'lucide-react';

export default function Historico() {
  const [eventos, setEventos] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [filters, setFilters] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    sucursal_id: '',
    camara_id: '',
    tipo: ''
  });

  useEffect(() => {
    loadSucursales();
    loadEventos();
  }, []);

  const loadSucursales = async () => {
    const res = await getSucursalesActivas();
    setSucursales(res.data);
  };

  const loadEventos = async () => {
    try {
      const res = await getEventos(filters);
      setEventos(res.data.results || res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Tipo', 'Cámara', 'Sucursal', 'Fecha Inicio', 'Fecha Fin', 'Temp Máx', 'Estado'].join(','),
      ...eventos.map(e => [
        e.tipo, e.camara_nombre, e.sucursal_nombre,
        e.fecha_inicio, e.fecha_fin || 'En curso', e.temp_max_c, e.estado
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eventos.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Filtros</h3>
          <button onClick={exportCSV} className="btn-primary flex items-center gap-2">
            <Download size={16} /> Exportar CSV
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="date"
            value={filters.fecha_desde}
            onChange={(e) => setFilters({...filters, fecha_desde: e.target.value})}
            className="input"
            placeholder="Fecha desde"
          />
          <input
            type="date"
            value={filters.fecha_hasta}
            onChange={(e) => setFilters({...filters, fecha_hasta: e.target.value})}
            className="input"
            placeholder="Fecha hasta"
          />
          <button onClick={loadEventos} className="btn-primary">Buscar</button>
        </div>
      </div>

      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Eventos ({eventos.length})</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4">Tipo</th>
                <th className="text-left py-3 px-4">Cámara</th>
                <th className="text-left py-3 px-4">Fecha Inicio</th>
                <th className="text-left py-3 px-4">Duración</th>
                <th className="text-left py-3 px-4">Temp Máx</th>
                <th className="text-left py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((evento) => (
                <tr key={evento.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-4">{evento.tipo}</td>
                  <td className="py-3 px-4">{evento.camara_nombre}</td>
                  <td className="py-3 px-4">{new Date(evento.fecha_inicio).toLocaleString()}</td>
                  <td className="py-3 px-4">{evento.duracion_minutos || '-'} min</td>
                  <td className="py-3 px-4">{evento.temp_max_c}°C</td>
                  <td className="py-3 px-4">{evento.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
