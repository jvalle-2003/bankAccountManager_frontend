// permissions.service.ts
import api from '../utils/endpointApi';

const ENDPOINT = '/permissions';

const ENDPOINT2 = '/role-permissions'; // ← Cambia de '/permissions' a '/role-permissions'


export const PermissionsService = {
    // Obtener todos los permisos
    async getAll() {
        const res = await api.get(ENDPOINT);
        return res.data;
    },

    // Obtener permisos por rol
    async getPermissionsByRole(roleId: number) {
        const res = await api.get(`${ENDPOINT2}/role/${roleId}`);
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