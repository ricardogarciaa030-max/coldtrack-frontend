/**
 * Página de Monitoreo en Tiempo Real
 * 
 * Muestra temperatura en vivo desde Firebase Realtime Database.
 * Permite seleccionar sucursal y cámara para ver datos en tiempo real.
 */

import React, { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../services/firebase';
import { getSucursalesActivas, getCamaras } from '../../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Activity } from 'lucide-react';

export default function Realtime() {
  const [sucursales, setSucursales] = useState([]);
  const [camaras, setCamaras] = useState([]);
  const [selectedSucursal, setSelectedSucursal] = useState('');
  const [selectedCamara, setSelectedCamara] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const initializeData = async () => {
      // Cargar sucursales
      await loadSucursales();
      
      // Restaurar selección desde localStorage
      const savedSucursalId = localStorage.getItem('selectedSucursalId');
      const savedCamaraId = localStorage.getItem('selectedCamaraId');
      
      if (savedSucursalId) {
        setSelectedSucursal(savedSucursalId);
        
        // Cargar cámaras inmediatamente si hay sucursal guardada
        if (savedCamaraId) {
          try {
            const res = await getCamaras({ sucursal_id: savedSucursalId });
            const camarasData = res.data.results || res.data;
            setCamaras(camarasData);
            
            // Restaurar cámara seleccionada
            const camara = camarasData.find(c => c.id === parseInt(savedCamaraId));
            if (camara) {
              setSelectedCamara(camara);
            }
          } catch (error) {
            console.error('Error al cargar cámaras:', error);
          }
        }
      }
    };
    
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedSucursal && !selectedCamara) {
      loadCamaras(selectedSucursal);
    }
  }, [selectedSucursal]);

  useEffect(() => {
    if (selectedCamara) {
      // Guardar selección en localStorage
      localStorage.setItem('selectedCamaraId', selectedCamara.id);
      localStorage.setItem('selectedSucursalId', selectedSucursal);
      
      const statusRef = ref(database, `/status/${selectedCamara.firebase_path}/live`);
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setLiveData(data);
          // Convertir timestamp de SEGUNDOS a Date (multiplicar por 1000 para JavaScript)
          const timestamp = new Date(data.ts * 1000);
          setHistory(prev => [...prev.slice(-19), {
            time: timestamp.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            temp: data.temp
          }]);
        }
      });
      return () => unsubscribe();
    }
  }, [selectedCamara, selectedSucursal]);

  const loadSucursales = async () => {
    try {
      const res = await getSucursalesActivas();
      setSucursales(res.data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const loadCamaras = async (sucursalId) => {
    try {
      const res = await getCamaras({ sucursal_id: sucursalId });
      setCamaras(res.data.results || res.data);
    } catch (error) {
      console.error('Error al cargar cámaras:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Selectores */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Sucursal</label>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="input w-full"
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Cámara</label>
            <select
              value={selectedCamara?.id || ''}
              onChange={(e) => {
                const camara = camaras.find(c => c.id === parseInt(e.target.value));
                setSelectedCamara(camara);
                setHistory([]);
              }}
              className="input w-full"
              disabled={!selectedSucursal}
            >
              <option value="">Seleccionar cámara</option>
              {camaras.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Estado actual */}
      {liveData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Temperatura Actual</p>
                <p className="text-4xl font-bold mt-2">{liveData.temp}°C</p>
              </div>
              <Thermometer className="text-primary-400" size={48} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Estado</p>
                <p className="text-2xl font-bold mt-2">{liveData.state}</p>
              </div>
              <Activity className="text-green-400" size={48} />
            </div>
          </div>

          <div className="card">
            <div>
              <p className="text-gray-400 text-sm">Última Actualización</p>
              <p className="text-lg font-medium mt-2">
                {new Date(liveData.ts * 1000).toLocaleString('es-CL', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit',
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico en tiempo real */}
      {history.length > 0 && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Temperatura en Tiempo Real</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
              <Line type="monotone" dataKey="temp" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
