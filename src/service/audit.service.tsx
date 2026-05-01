import axios from 'axios';
import { Audit } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const auditService = {
    async getAll(): Promise<Audit[]> {
        const response = await axios.get(`${API_URL}/audits`); 
        return response.data;
    },

    async getById(id: number): Promise<Audit> {
        const response = await axios.get(`${API_URL}/audits/${id}`); 
        return response.data;
    }
};