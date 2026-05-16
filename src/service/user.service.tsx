
import api from '../utils/endpointApi'; 

const ENDPOINT = '/users';

export const UserService = {
    async getAll() {
        try {
            const res = await api.get(ENDPOINT);
            return res.data.data ? res.data.data : res.data;
        } catch (error) {
            console.error("Error en UserService.getAll:", error);
            throw error; 
        }
    },

    async create(data: any) {
        try {
            const res = await api.post(ENDPOINT, data);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.create:", error);
            throw error;
        }
    },

    async update(id: number, data: any) {
        try {
            const res = await api.put(`${ENDPOINT}/${id}`, data);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.update:", error);
            throw error;
        }
    },

    async delete(id: number) {
        try {
            const res = await api.delete(`${ENDPOINT}/${id}`);
            return res.data;
        } catch (error) {
            console.error("Error en UserService.delete:", error);
            throw error;
        }
    }
};