import axios from 'axios';

const API_URL = 'http://localhost:3001/api/audits';

export const AuditService = {
    // GET: Obtener todos los registros de auditoría
    async getAll() {
        const res = await axios.get(API_URL);
        return res.data;
    },

    // POST: Crear una nueva auditoría
    async create(data: any) {
        // Axios envía automáticamente el objeto como JSON
        const res = await axios.post(API_URL, data);
        return res.data;
    },

    // PUT: Actualizar una auditoría por ID
    async update(id: number, data: any) {
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    },

    // DELETE: Eliminar un registro de auditoría
    async delete(id: number) {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    }
};