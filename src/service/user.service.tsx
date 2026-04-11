import axios from 'axios';

// Es buena práctica definir la base y usarla según el recurso
const BASE_URL = 'http://localhost:3001/api';
const API_URL = `${BASE_URL}/users`;

export const UserService = {
    async getAll() {
        try {
            const res = await axios.get(API_URL);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.getAll:", error);
            throw error; // Re-lanzamos para que el componente (Toast) lo capture
        }
    },

    async create(data: any) {
        try {
            const res = await axios.post(API_URL, data);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.create:", error);
            throw error;
        }
    },

    async update(id: number, data: any) {
        try {
            const res = await axios.put(`${API_URL}/${id}`, data);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.update:", error);
            throw error;
        }
    },

    async delete(id: number) {
        try {
            const res = await axios.delete(`${API_URL}/${id}`);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.delete:", error);
            throw error;
        }
    }
};