import axios from 'axios';

const API_URL = 'http://localhost:3001/api/roles';

export const RoleService = {
    // GET: Obtener todos
    async getAll() {
        const res = await axios.get(API_URL);
        return res.data; 
    },

    // POST: Crear nuevo rol
    async create(data: any) {
        // Axios detecta que 'data' es un objeto y envía JSON automáticamente
        const res = await axios.post(API_URL, data);
        return res.data;
    },

    // PUT: Actualizar rol
    async update(id: number, data: any) {
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    },

    // DELETE: Eliminar rol
    async delete(id: number) {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    }
};