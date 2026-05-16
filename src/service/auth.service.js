// src/service/AuthService.js
import api from './api';

export const AuthService = {
    // Iniciar sesión
    login: async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        return response.data; // Retorna { success: true, user: {...} }
    },

    // Cerrar sesión
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    },

    // Verificar si la sesión sigue activa al recargar la página
    // (Opcional pero recomendado: requiere un endpoint tipo GET /api/auth/me en tu backend)
    getCurrentUser: async () => {
        const response = await api.get('/auth/me');
        return response.data;
    }
};