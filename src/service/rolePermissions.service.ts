import axios from 'axios';
import { RolePermission } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Función para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const rolePermissionsService = {
    // Obtener todas las asignaciones
    async getAll(): Promise<RolePermission[]> {
        const response = await axios.get(`${API_URL}/role-permissions`, getAuthHeaders());
        return response.data;
    },

    // Obtener asignaciones por rol
    async getByRole(roleId: number): Promise<RolePermission[]> {
        const response = await axios.get(`${API_URL}/role-permissions/role/${roleId}`, getAuthHeaders());
        return response.data;
    },

    // Obtener asignaciones por permiso
    async getByPermission(permissionId: number): Promise<RolePermission[]> {
        const response = await axios.get(`${API_URL}/role-permissions/permission/${permissionId}`, getAuthHeaders());
        return response.data;
    },

    // Asignar permiso a rol
    async create(data: RolePermission): Promise<RolePermission> {
        const response = await axios.post(`${API_URL}/role-permissions`, data, getAuthHeaders());
        return response.data;
    },

    // Eliminar asignación
    async delete(roleId: number, permissionId: number): Promise<void> {
        await axios.delete(`${API_URL}/role-permissions/role/${roleId}/permission/${permissionId}`, getAuthHeaders());
    }
};