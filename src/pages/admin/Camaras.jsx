/**
 * Gestión de Cámaras - Solo ADMIN
 */

import React, { useState, useEffect } from 'react';
import { getCamaras, getSucursales, createCamara, updateCamara, deleteCamara } from '../../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Camaras() {
  const [camaras, setCamaras] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCamara, setEditingCamara] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '', codigo: '', firebase_path: '', tipo: 'CAMARA', sucursal: '', activa: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [camarasRes, sucursalesRes] = await Promise.all([getCamaras(), getSucursales()]);
    setCamaras(camarasRes.data.results || camarasRes.data);
    setSucursales(sucursalesRes.data.results || sucursalesRes.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCamara) {
        await updateCamara(editingCamara.id, formData);
      } else {
        await createCamara(formData);
      }
      loadData();
      setShowModal(false);
      setFormData({ nombre: '', codigo: '', firebase_path: '', tipo: 'CAMARA', sucursal: '', activa: true });
      setEditingCamara(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (camara) => {
    setEditingCamara(camara);
    setFormData({ ...camara, sucursal: camara.sucursal });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar cámara?')) {
      await deleteCamara(id);
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Cámaras de Frío</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva Cámara
        </button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4">Nombre</th>
              <th className="text-left py-3 px-4">Código</th>
              <th className="text-left py-3 px-4">Sucursal</th>
              <th className="text-left py-3 px-4">Tipo</th>
              <th className="text-left py-3 px-4">Firebase Path</th>
              <th className="text-left py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {camaras.map((c) => (
              <tr key={c.id} className="border-b border-gray-700">
                <td className="py-3 px-4">{c.nombre}</td>
                <td className="py-3 px-4">{c.codigo}</td>
                <td className="py-3 px-4">{c.sucursal?.nombre}</td>
                <td className="py-3 px-4">{c.tipo}</td>
                <td className="py-3 px-4 font-mono text-sm">{c.firebase_path}</td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => handleEdit(c)} className="text-blue-400 hover:text-blue-300">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingCamara ? 'Editar' : 'Nueva'} Cámara</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" placeholder="Nombre" value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="input w-full" required />
              <input type="text" placeholder="Código" value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                className="input w-full" />
              <input type="text" placeholder="Firebase Path (device_id)" value={formData.firebase_path}
                onChange={(e) => setFormData({...formData, firebase_path: e.target.value})}
                className="input w-full" required />
              <select value={formData.sucursal} onChange={(e) => setFormData({...formData, sucursal: e.target.value})}
                className="input w-full" required>
                <option value="">Seleccionar sucursal</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                className="input w-full">
                <option value="CAMARA">Cámara</option>
                <option value="CAMION">Camión</option>
                <option value="BODEGA">Bodega</option>
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.activa}
                  onChange={(e) => setFormData({...formData, activa: e.target.checked})} />
                Activa
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Guardar</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingCamara(null); }}
                  className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
