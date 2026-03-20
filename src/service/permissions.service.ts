import axios from 'axios';
import { Permission } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const permissionsService = {
    /**
     * OBTENER TODOS LOS PERMISOS
     * GET /api/permissions
     */
    async getAll(): Promise<Permission[]> {
        const response = await axios.get(`${API_URL}/permissions`);
        return response.data;
    },

    /**
     * OBTENER UN PERMISO POR ID
     * GET /api/permissions/:id
     */
    async getById(id: number): Promise<Permission> {
        const response = await axios.get(`${API_URL}/permissions/${id}`);
        return response.data;
    },

    /**
     * CREAR UN NUEVO PERMISO
     * POST /api/permissions
     */
    async create(data: Omit<Permission, 'id_permission'>): Promise<Permission> {
        const response = await axios.post(`${API_URL}/permissions`, data);
        return response.data;
    },

    /**
     * ACTUALIZAR UN PERMISO
     * PUT /api/permissions/:id
     */
    async update(id: number, data: Partial<Permission>): Promise<Permission> {
        const response = await axios.put(`${API_URL}/permissions/${id}`, data);
        return response.data;
    },

    /**
     * ELIMINAR UN PERMISO
     * DELETE /api/permissions/:id
     */
    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/permissions/${id}`);
    }
};