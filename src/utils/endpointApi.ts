import axios from 'axios';

// 1. Creamos la instancia habilitando el intercambio de cookies
const api = axios.create({
    baseURL: 'http://localhost:3001/api', // Tu URL del backend
    withCredentials: true // ¡ESTO ES CRÍTICO! Permite que Axios envíe y reciba la cookie de forma automática
});
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Si el servidor dice que el token no es válido o expiró, limpiamos datos locales
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem('user');
                // Redirigir al login (ajusta la ruta según uses Vite o Next.js)
                window.location.href = '/auth/login'; 
            }
        }
        return Promise.reject(error);
    }
);

export default api;