// src/service/role.service.ts
import api from '../utils/endpointApi';

const ENDPOINT = '/roles';

export const RoleService = {
    async getAll() {
        const res = await api.get(ENDPOINT);
        return res.data;
    },

    async getById(id: number) {
        const res = await api.get(`${ENDPOINT}/${id}`);
        return res.data;
    },

    async create(data: any) {
        const res = await api.post(ENDPOINT, data);
        return res.data;
    },

    async update(id: number, data: any) {
        const res = await api.put(`${ENDPOINT}/${id}`, data);
        return res.data;
    },

    async delete(id: number) {
        const res = await api.delete(`${ENDPOINT}/${id}`);
        return res.data;
    }
};
