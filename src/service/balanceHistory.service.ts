import { BalanceHistory } from '@/types';

import api from '../utils/endpointApi'; 

const ENDPOINT = '/balance-history';

// Función para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const balanceHistoryService = {
    async getAll(): Promise<BalanceHistory[]> {
        const response = await api.get(`${ENDPOINT}`, getAuthHeaders());
        return response.data;
    },

    async getById(id: number): Promise<BalanceHistory> {
        const response = await api.get(`${ENDPOINT}/${id}`, getAuthHeaders());
        return response.data;
    },

    async create(data: Omit<BalanceHistory, 'history_id'>): Promise<BalanceHistory> {
        const response = await api.post(`${ENDPOINT}`, data, getAuthHeaders());
        return response.data;
    },

    async update(id: number, data: Partial<BalanceHistory>): Promise<BalanceHistory> {
        const response = await api.put(`${ENDPOINT}/${id}`, data, getAuthHeaders());
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${ENDPOINT}/${id}`, getAuthHeaders());
    }
};