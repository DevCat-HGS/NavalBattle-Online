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
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password) => api.post('/auth/register', { username, password }),
  getUser: (token) => api.get('/auth/user', {
    headers: { 'x-auth-token': token }
  }),
};

export const roomsService = {
  getPublicRooms: () => api.get('/rooms/public'),
  createRoom: (data) => api.post('/rooms', data),
  getRoomInfo: (roomId) => api.get(`/rooms/${roomId}`),
  joinRoom: (roomId, data) => api.post(`/rooms/${roomId}/join`, data),
};