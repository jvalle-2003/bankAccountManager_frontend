import axios from 'axios';

const API_URL = 'http://localhost:3001/api/categories';

export const CategoryService = {
    // Obtener todos los registros
    async getAll() {
        const res = await axios.get(API_URL);
        return res.data;
    },

    // Crear un nuevo registro
    async create(data: any) {
        const res = await axios.post(API_URL, data);
        return res.data;
    },

    // Actualizar un registro existente
    async update(id: string, data: any) {
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    },

    // Cambio de estado (Toggle)
    async delete(id: string) {
        await axios.patch(`${API_URL}/${id}/toggle`);
    }
};
