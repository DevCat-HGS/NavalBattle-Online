import axios from 'axios';

// Obtener la URL base de la API desde las variables de entorno
const apiUrl = import.meta.env.VITE_API_URL || 'https://game-battleship-production.up.railway.app';

// Crear una instancia de axios con la configuración base
const api = axios.create({
  baseURL: apiUrl,
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Exportar la instancia configurada
export default api;

// Funciones de ayuda para endpoints comunes
export const authService = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  register: (username, password) => api.post('/api/auth/register', { username, password }),
  getUser: (token) => api.get('/api/auth/user', {
    headers: { 'x-auth-token': token }
  }),
};

export const roomsService = {
  getPublicRooms: () => api.get('/api/rooms/public'),
  createRoom: (data) => api.post('/api/rooms', data),
  getRoomInfo: (roomId) => api.get(`/api/rooms/${roomId}`),
  joinRoom: (roomId, data) => api.post(`/api/rooms/${roomId}/join`, data),
};

// Interceptor para depurar respuestas
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.data || error.message);
    return Promise.reject(error);
  }
);