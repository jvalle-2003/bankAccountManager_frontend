import axios from 'axios';
import { User } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const usersService = {
    async getAll(): Promise<User[]> {
        const response = await axios.get(`${API_URL}/users`);
        return response.data;
    },

    async getById(id: number): Promise<User> {
        const response = await axios.get(`${API_URL}/users/${id}`);
        return response.data;
    },

    async create(data: Omit<User, 'user_id'>): Promise<User> {
        const response = await axios.post(`${API_URL}/users`, data);
        return response.data;
    },

    async update(id: number, data: Partial<User>): Promise<User> {
        const response = await axios.put(`${API_URL}/users/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/users/${id}`);
    }
};