import axios from 'axios';
import { Role } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const rolesService = {
    async getAll(): Promise<Role[]> {
        const response = await axios.get(`${API_URL}/roles`);
        return response.data;
    },

    async getById(id: number): Promise<Role> {
        const response = await axios.get(`${API_URL}/roles/${id}`);
        return response.data;
    },

    async create(data: Omit<Role, 'role_id'>): Promise<Role> {
        const response = await axios.post(`${API_URL}/roles`, data);
        return response.data;
    },

    async update(id: number, data: Partial<Role>): Promise<Role> {
        const response = await axios.put(`${API_URL}/roles/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/roles/${id}`);
    }
};