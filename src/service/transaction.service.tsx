import api from '../utils/endpointApi'; 

const ENDPOINT = '/transactions';


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
        const res = await api.get(ENDPOINT);
        return res.data;
    },

    // Obtener una sola transacción por ID (findOne)
    async getById(id: string) {
        const res = await api.get(`${ENDPOINT}/${id}`);
        return res.data;
    },

    // Crear una nueva transacción (post "/")
    async create(data: any) {
        const res = await api.post(ENDPOINT, data);
        return res.data;
    },

    // Actualizar una transacción (put "/:id")
    async update(id: string, data: any) {
        const res = await api.put(`${ENDPOINT}/${id}`, data);
        return res.data;
    },

    // Cancelar transacción
    async cancel(id: string, reason: string) {
        const res = await api.patch(`${ENDPOINT}/${id}/cancel`, { reason: reason });
        return res.data;
    }
};