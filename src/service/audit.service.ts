import axios from 'axios';
import { Audit } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const auditService = {
    async getAll(): Promise<Audit[]> {
        const response = await axios.get(`${API_URL}/audits`);  // 👈 CAMBIADO
        return response.data;
    },

    async getById(id: number): Promise<Audit> {
        const response = await axios.get(`${API_URL}/audits/${id}`);  // 👈 CAMBIADO
        return response.data;
    },

    async create(data: Omit<Audit, 'audit_id'>): Promise<Audit> {
        const response = await axios.post(`${API_URL}/audits`, data);  // 👈 CAMBIADO
        return response.data;
    },

    async update(id: number, data: Partial<Audit>): Promise<Audit> {
        const response = await axios.put(`${API_URL}/audits/${id}`, data);  // 👈 CAMBIADO
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/audits/${id}`);  // 👈 CAMBIADO
    }
};