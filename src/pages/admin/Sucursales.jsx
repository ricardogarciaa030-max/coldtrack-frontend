/**
 * Gestión de Sucursales - Solo ADMIN
 */

import React, { useState, useEffect } from 'react';
import { getSucursales, createSucursal, updateSucursal, deleteSucursal } from '../../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Sucursales() {
  const [sucursales, setSucursales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', direccion: '', descripcion: '', activa: true });

  useEffect(() => {
    loadSucursales();
  }, []);

  const loadSucursales = async () => {
    const res = await getSucursales();
    setSucursales(res.data.results || res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSucursal) {
        await updateSucursal(editingSucursal.id, formData);
      } else {
        await createSucursal(formData);
      }
      loadSucursales();
      setShowModal(false);
      setFormData({ nombre: '', direccion: '', descripcion: '', activa: true });
      setEditingSucursal(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (sucursal) => {
    setEditingSucursal(sucursal);
    setFormData(sucursal);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Eliminar sucursal?')) {
      await deleteSucursal(id);
      loadSucursales();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sucursales</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva Sucursal
        </button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4">Nombre</th>
              <th className="text-left py-3 px-4">Dirección</th>
              <th className="text-left py-3 px-4">Estado</th>
              <th className="text-left py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.map((s) => (
              <tr key={s.id} className="border-b border-gray-700">
                <td className="py-3 px-4">{s.nombre}</td>
                <td className="py-3 px-4">{s.direccion}</td>
                <td className="py-3 px-4">{s.activa ? 'Activa' : 'Inactiva'}</td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => handleEdit(s)} className="text-blue-400 hover:text-blue-300">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300">
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
            <h3 className="text-xl font-bold mb-4">{editingSucursal ? 'Editar' : 'Nueva'} Sucursal</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="input w-full"
                required
              />
              <input
                type="text"
                placeholder="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                className="input w-full"
              />
              <textarea
                placeholder="Descripción"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="input w-full"
                rows="3"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.activa}
                  onChange={(e) => setFormData({...formData, activa: e.target.checked})}
                />
                Activa
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Guardar</button>
                <button type="button" onClick={() => { setShowModal(false); setEditingSucursal(null); }} className="btn-secondary flex-1">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
