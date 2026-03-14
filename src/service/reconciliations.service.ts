import axios from 'axios';
import { Reconciliation } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const reconciliationsService = {
    async getAll(): Promise<Reconciliation[]> {
        const response = await axios.get(`${API_URL}/reconciliations`);
        return response.data;
    },

    async getById(id: number): Promise<Reconciliation> {
        const response = await axios.get(`${API_URL}/reconciliations/${id}`);
        return response.data;
    },

    async create(data: Omit<Reconciliation, 'reconciliation_id'>): Promise<Reconciliation> {
        const response = await axios.post(`${API_URL}/reconciliations`, data);
        return response.data;
    },

    async update(id: number, data: Partial<Reconciliation>): Promise<Reconciliation> {
        const response = await axios.put(`${API_URL}/reconciliations/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/reconciliations/${id}`);
    }
};