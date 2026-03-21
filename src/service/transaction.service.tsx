import axios from 'axios';

const API_URL = 'http://localhost:3001/api/transactions';

export const TransactionService = {
    // Obtener todas las transacciones (findAll)
    async getAll() {
        const res = await axios.get(API_URL);
        return res.data;
    },

    // Obtener una sola transacción por ID (findOne)
    async getById(id: string) {
        const res = await axios.get(`${API_URL}/${id}`);
        return res.data;
    },

    // Crear una nueva transacción (post "/")
    async create(data: any) {
        const res = await axios.post(API_URL, data);
        return res.data;
    },

    // Actualizar una transacción (put "/:id")
    async update(id: string, data: any) {
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    },

// Ahora recibe 'reason' como argumento
async cancel(id: string, reason: string) {
    // El segundo parámetro de axios.patch es el BODY
    const res = await axios.patch(`${API_URL}/${id}/cancel`, { reason: reason });
    return res.data;
}
};