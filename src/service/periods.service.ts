import { Period } from '@/types';
import api from '../utils/endpointApi'; 

const ENDPOINT = '/periods';

export const periodsService = {
    async getAll(): Promise<Period[]> {
        const response = await api.get(ENDPOINT);
        return response.data;
    },

    async getById(id: number): Promise<Period> {
        const response = await api.get(`${ENDPOINT}/${id}`);
        return response.data;
    },

    async create(data: Omit<Period, 'period_id'>): Promise<Period> {
        const response = await api.post(ENDPOINT, data);
        return response.data;
    },

    async update(id: number, data: Partial<Period>): Promise<Period> {
        const response = await api.put(`${ENDPOINT}/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${ENDPOINT}/${id}`);
    }
};