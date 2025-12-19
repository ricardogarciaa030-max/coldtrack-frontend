/**
 * Gestión de Usuarios - Solo ADMIN
 */

import React, { useState, useEffect } from 'react';
import { getUsuarios, getSucursales, createUsuario, updateUsuario, deleteUsuario } from '../../services/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formKey, setFormKey] = useState(0); // Para forzar re-render del formulario
  const [formData, setFormData] = useState({
    nombre: '', email: '', password: '', rol: 'SUBJEFE', sucursal_id: null, activo: true
  });

  useEffect(() => {
    loadData();
  }, []);

  // Limpiar formulario cuando se abre modal para nuevo usuario
  useEffect(() => {
    if (showModal && !editingUsuario) {
      setFormData({ nombre: '', email: '', password: '', rol: 'SUBJEFE', sucursal_id: null, activo: true });
      setFormKey(prev => prev + 1); // Forzar re-render del formulario
    }
  }, [showModal, editingUsuario]);

  const loadData = async () => {
    const [usuariosRes, sucursalesRes] = await Promise.all([getUsuarios(), getSucursales()]);
    setUsuarios(usuariosRes.data.results || usuariosRes.data);
    setSucursales(sucursalesRes.data.results || sucursalesRes.data);
  };

  const resetForm = () => {
    setFormData({ nombre: '', email: '', password: '', rol: 'SUBJEFE', sucursal_id: null, activo: true });
    setEditingUsuario(null);
    setFormKey(prev => prev + 1); // Forzar re-render
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!editingUsuario) {
      if (!formData.nombre || !formData.email || !formData.password) {
        alert('Por favor completa todos los campos requeridos');
        return;
      }
      if (formData.password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
    }
    
    try {
      if (editingUsuario) {
        await updateUsuario(editingUsuario.id, formData);
        alert('Usuario actualizado exitosamente!');
      } else {
        await createUsuario(formData);
        alert('Usuario creado exitosamente!');
      }
      
      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error al crear/actualizar usuario:', error);
      alert(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({ 
      nombre: usuario.nombre,
      email: usuario.email,
      password: '', // No mostrar password existente por seguridad
      rol: usuario.rol,
      sucursal_id: usuario.sucursal_id || null,
      activo: usuario.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id, nombre) => {
    if (confirm(`¿Estás seguro de que quieres eliminar completamente al usuario "${nombre}"?\n\nEsta acción eliminará el usuario de Firebase Auth y Supabase y NO se puede deshacer.`)) {
      try {
        await deleteUsuario(id);
        alert('Usuario eliminado exitosamente');
        loadData();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        alert(`Error al eliminar usuario: ${error.response?.data?.error || error.message}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usuarios</h2>
        <button onClick={() => {
          setEditingUsuario(null); // Asegurar que no estamos editando
          setShowModal(true);
        }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo Usuario
        </button>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4">Nombre</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Rol</th>
              <th className="text-left py-3 px-4">Sucursal</th>
              <th className="text-left py-3 px-4">Estado</th>
              <th className="text-left py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-b border-gray-700">
                <td className="py-3 px-4">{u.nombre}</td>
                <td className="py-3 px-4">{u.email}</td>
                <td className="py-3 px-4">{u.rol}</td>
                <td className="py-3 px-4">{u.sucursal_data?.nombre || '-'}</td>
                <td className="py-3 px-4">{u.activo ? 'Activo' : 'Inactivo'}</td>
                <td className="py-3 px-4 flex gap-2">
                  <button onClick={() => handleEdit(u)} className="text-blue-400 hover:text-blue-300">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(u.id, u.nombre)} className="text-red-400 hover:text-red-300" title="Eliminar usuario completamente">
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
            <h3 className="text-xl font-bold mb-4">{editingUsuario ? 'Editar' : 'Nuevo'} Usuario</h3>
            {!editingUsuario && (
              <div className="bg-blue-900/30 border border-blue-500 rounded p-3 mb-4">
                <p className="text-sm text-blue-200">
                  El usuario se creará automáticamente en Firebase Auth y se sincronizará con Supabase.
                </p>
              </div>
            )}
            <form key={formKey} onSubmit={handleSubmit} className="space-y-4">

              <input type="text" placeholder="Nombre completo" value={formData.nombre || ''}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                className="input w-full" required />
              <input type="email" placeholder="Email" value={formData.email || ''}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input w-full" required />
              <input type="password" placeholder={editingUsuario ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"} value={formData.password || ''}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input w-full" required={!editingUsuario} minLength="6" />
              <select value={formData.rol || 'SUBJEFE'} onChange={(e) => setFormData({...formData, rol: e.target.value})}
                className="input w-full">
                <option value="ADMIN">Administrador</option>
                <option value="ENCARGADO">Encargado</option>
                <option value="SUBJEFE">Subjefe</option>
              </select>
              <select value={formData.sucursal_id || ''} onChange={(e) => setFormData({...formData, sucursal_id: e.target.value ? parseInt(e.target.value) : null})}
                className="input w-full">
                <option value="">Sin sucursal asignada</option>
                {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.activo}
                  onChange={(e) => setFormData({...formData, activo: e.target.checked})} />
                Activo
              </label>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">Guardar</button>
                <button type="button" onClick={closeModal}
                  className="btn-secondary flex-1">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
