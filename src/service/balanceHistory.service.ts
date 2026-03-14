import axios from 'axios';
import { BalanceHistory } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const balanceHistoryService = {
    async getAll(): Promise<BalanceHistory[]> {
        const response = await axios.get(`${API_URL}/balance-history`);
        return response.data;
    },

    async getById(id: number): Promise<BalanceHistory> {
        const response = await axios.get(`${API_URL}/balance-history/${id}`);
        return response.data;
    },

    async create(data: Omit<BalanceHistory, 'history_id'>): Promise<BalanceHistory> {
        const response = await axios.post(`${API_URL}/balance-history`, data);
        return response.data;
    },

    async update(id: number, data: Partial<BalanceHistory>): Promise<BalanceHistory> {
        const response = await axios.put(`${API_URL}/balance-history/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/balance-history/${id}`);
    }
};