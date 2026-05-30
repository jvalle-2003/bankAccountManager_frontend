// rolePermissions.service.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export const rolePermissionsService = {
    async getAll() {
        const response = await axios.get(`${API_URL}/role-permissions`, getAuthHeaders());
        return response.data;
    },

    async getByRole(roleId: number) {
        const response = await axios.get(`${API_URL}/role-permissions/role/${roleId}`, getAuthHeaders());
        return response.data;
    },

    async getByPermission(permissionId: number) {
        const response = await axios.get(`${API_URL}/role-permissions/permission/${permissionId}`, getAuthHeaders());
        return response.data;
    },

    async create(data: { role_id: number; permission_id: number; assignment_date: string }) {
        // Asegurarse de que permission_id sea un número válido (incluyendo 0)
        const sendData = {
            ...data,
            permission_id: Number(data.permission_id)
        };
        const response = await axios.post(`${API_URL}/role-permissions`, sendData, getAuthHeaders());
        return response.data;
    },

    async delete(roleId: number, permissionId: number) {
        await axios.delete(`${API_URL}/role-permissions/role/${roleId}/permission/${permissionId}`, getAuthHeaders());
    }
};
