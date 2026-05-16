import api from '../utils/endpointApi'; 

const ENDPOINT = '/categories';

export const CategoryService = {
    // Obtener todos los registros
    async getAll() {
        const res = await api.get(ENDPOINT);
        return res.data;
    },

    // Crear un nuevo registro
    async create(data: any) {
        const res = await api.post(ENDPOINT, data);
        return res.data;
    },

    // Actualizar un registro existente
    async update(id: string, data: any) {
        const res = await api.put(`${ENDPOINT}/${id}`, data);
        return res.data;
    },

    // Cambio de estado (Toggle)
    async delete(id: string) {
        await api.patch(`${ENDPOINT}/${id}/toggle`);
    }
};
