import axios from 'axios';

const API_URL = 'http://localhost:3001/api/users';

export const UserService = {
    async getAll() {
        // Axios ya devuelve el JSON parseado en la propiedad .data
        const res = await axios.get(API_URL);
        return res.data;
    },

    async create(data: any) {
        // No hace falta JSON.stringify ni headers manuales para el Content-Type
        const res = await axios.post(API_URL, data);
        return res.data;
    },

    async update(id: number, data: any) {
        // Estructura similar al POST: URL y luego el cuerpo (body)
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    },

    async delete(id: number) {
        await axios.delete(`${API_URL}/${id}`);
    }
};