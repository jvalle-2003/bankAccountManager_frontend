import axios from 'axios';

const API_URL = 'http://localhost:3001/api/transactions';

// Función para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const TransactionService = {
    // Obtener todas las transacciones (findAll)
    async getAll() {
        const res = await axios.get(API_URL, getAuthHeaders());
        return res.data;
    },

    // Obtener una sola transacción por ID (findOne)
    async getById(id: string) {
        const res = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
        return res.data;
    },

    // Crear una nueva transacción (post "/")
    async create(data: any) {
        const res = await axios.post(API_URL, data, getAuthHeaders());
        return res.data;
    },

    // Actualizar una transacción (put "/:id")
    async update(id: string, data: any) {
        const res = await axios.put(`${API_URL}/${id}`, data, getAuthHeaders());
        return res.data;
    },

    // Cancelar transacción
    async cancel(id: string, reason: string) {
        const res = await axios.patch(`${API_URL}/${id}/cancel`, { reason: reason }, getAuthHeaders());
        return res.data;
    }
};