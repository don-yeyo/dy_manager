import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para inyectar x-user-email en cada llamada
api.interceptors.request.use((config) => {
  const storedUser = localStorage.getItem('dy_current_user');
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      if (user?.email) {
        config.headers['x-user-email'] = user.email;
      }
    } catch (_) {}
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor de respuesta para capturar expiración o desactivación y fallos de conexión/500
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data?.error === 'Usuario inactivo') {
      alert('Tu cuenta ha sido desactivada. Serás redirigido al inicio.');
      localStorage.removeItem('dy_current_user');
      window.location.href = '/login';
    }

    // Notificar al guardián de base de datos (DbConnectionGuard) ignorando llamadas a su propio endpoint
    if (error.config && !error.config.url?.includes('/system/db-status')) {
      const eventDetail = {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      };
      window.dispatchEvent(new CustomEvent('api-request-failed', { detail: eventDetail }));
    }

    return Promise.reject(error);
  }
);

// Servicios organizados
export const AuthService = {
  sync: (userData) => api.post('/auth/sync', userData),
  getMe: () => api.get('/auth/me')
};

export const AppsService = {
  getMyApps: (all = false) => api.get(`/apps/my-apps${all ? '?all=true' : ''}`),
  getAll: () => api.get('/apps'),
  create: (data) => api.post('/apps', data),
  update: (id, data) => api.put(`/apps/${id}`, data),
  delete: (id) => api.delete(`/apps/${id}`),
  getAssignments: (id) => api.get(`/apps/${id}/assignments`),
  saveAssignments: (id, data) => api.post(`/apps/${id}/assignments`, data)
};

export const UsersService = {
  getAll: () => api.get('/users'),
  create: (data) => api.post('/users', data),
  updateRole: (id, rol) => api.put(`/users/${id}/role`, { rol }),
  updateStatus: (id, activo) => api.put(`/users/${id}/status`, { activo }),
  getUserApps: (id) => api.get(`/users/${id}/apps`),
  saveUserApps: (id, appIds) => api.post(`/users/${id}/apps`, { appIds })
};

export const GroupsService = {
  getAll: () => api.get('/groups'),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  getDetails: (id) => api.get(`/groups/${id}/details`),
  saveMembers: (id, userIds) => api.post(`/groups/${id}/members`, { userIds }),
  saveApps: (id, appIds) => api.post(`/groups/${id}/apps`, { appIds })
};

export const StatsService = {
  trackClick: (appId) => api.post('/stats/track', { appId }),
  getSummary: () => api.get('/stats/summary'),
  getLogs: (params) => api.get('/stats/logs', { params })
};

export const AuditService = {
  getLogs: (params) => api.get('/audit', { params })
};

export const UserConfigService = {
  getBoardConfig: () => api.get('/user-config/board'),
  saveBoardConfig: (secciones) => api.put('/user-config/board', { secciones })
};

export const SystemService = {
  getVersion: (v) => api.get(`/system/version${v ? `?v=${v}` : ''}`),
  getDbStatus: () => api.get('/system/db-status')
};

export default api;

