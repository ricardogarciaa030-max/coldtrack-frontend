/**
 * Cliente API
 * 
 * Configura axios para comunicarse con el backend Django.
 * Incluye interceptores para agregar el token de autenticación.
 */

import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      console.error('Sesión expirada');
      // Aquí podrías redirigir al login
    }
    return Promise.reject(error);
  }
);

export default api;

// Funciones de API específicas

// Auth
export const verifyToken = (token) => api.post('/auth/verify-token/', { token });
export const getCurrentUser = () => api.get('/auth/me/');

// Dashboard
export const getKPIs = () => api.get('/dashboard/kpis/');
export const getEventosPorDia = () => api.get('/dashboard/eventos-por-dia/');
export const getEventosRecientes = () => api.get('/dashboard/eventos-recientes/');
export const getResumenSemanal = () => api.get('/dashboard/resumen-semanal/');

// Sucursales
export const getSucursales = () => api.get('/sucursales/');
export const getSucursalesActivas = () => api.get('/sucursales/activas/');
export const createSucursal = (data) => api.post('/sucursales/', data);
export const updateSucursal = (id, data) => api.put(`/sucursales/${id}/`, data);
export const deleteSucursal = (id) => api.delete(`/sucursales/${id}/`);

// Cámaras
export const getCamaras = (params) => api.get('/camaras/', { params });
export const getCamara = (id) => api.get(`/camaras/${id}/`);
export const getLiveStatus = (id) => api.get(`/camaras/${id}/live_status/`);
export const createCamara = (data) => api.post('/camaras/', data);
export const updateCamara = (id, data) => api.put(`/camaras/${id}/`, data);
export const deleteCamara = (id) => api.delete(`/camaras/${id}/`);

// Eventos
export const getEventos = (params) => api.get('/eventos/', { params });
export const getEventosRecientesAPI = () => api.get('/eventos/recientes/');
export const getEventosEnCurso = () => api.get('/eventos/en_curso/');
export const updateEvento = (id, data) => api.patch(`/eventos/${id}/`, data);

// Lecturas
export const getLecturas = (params) => api.get('/lecturas/temperaturas/', { params });
export const getResumenDiario = (params) => api.get('/lecturas/resumen-diario/', { params });

// Usuarios
export const getUsuarios = (params) => api.get('/users/', { params });
export const createUsuario = (data) => api.post('/users/', data);
export const updateUsuario = (id, data) => api.put(`/users/${id}/`, data);
export const deleteUsuario = (id) => api.delete(`/users/${id}/`);

// Análisis Ejecutivo
export const getAnalisisEjecutivo = (params) => {
  console.log('🌐 API: Llamando análisis ejecutivo');
  console.log('📤 Parámetros enviados:', params);
  
  return api.get('/dashboard/analisis-ejecutivo/', { params })
    .then(response => {
      console.log('📥 Respuesta recibida del servidor');
      console.log('📊 Total eventos en respuesta:', response.data?.kpis?.totalEventos);
      return response;
    })
    .catch(error => {
      console.error('❌ Error en llamada API:', error);
      throw error;
    });
};

// Guardar Resumen Ejecutivo
export const guardarResumenEjecutivo = (data) => {
  console.log('💾 API: Guardando resumen ejecutivo');
  console.log('📤 Datos enviados:', data);
  
  return api.post('/dashboard/guardar-resumen-ejecutivo/', data)
    .then(response => {
      console.log('✅ Resumen guardado exitosamente');
      return response;
    })
    .catch(error => {
      console.error('❌ Error al guardar resumen:', error);
      throw error;
    });
};

// Obtener Resúmenes Ejecutivos
export const getResumenesEjecutivos = (params = {}) => {
  console.log('📋 API: Obteniendo resúmenes ejecutivos');
  
  return api.get('/dashboard/resumenes-ejecutivos/', { params })
    .then(response => {
      console.log('📥 Resúmenes obtenidos:', response.data?.total || 0);
      return response;
    })
    .catch(error => {
      console.error('❌ Error al obtener resúmenes:', error);
      throw error;
    });
};
