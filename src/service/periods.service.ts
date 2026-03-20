import axios from 'axios';
import { Period } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const periodsService = {
    async getAll(): Promise<Period[]> {
        const response = await axios.get(`${API_URL}/periods`);
        return response.data;
    },

    async getById(id: number): Promise<Period> {
        const response = await axios.get(`${API_URL}/periods/${id}`);
        return response.data;
    },

    async create(data: Omit<Period, 'period_id'>): Promise<Period> {
        const response = await axios.post(`${API_URL}/periods`, data);
        return response.data;
    },

    async update(id: number, data: Partial<Period>): Promise<Period> {
        const response = await axios.put(`${API_URL}/periods/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/periods/${id}`);
    }
};