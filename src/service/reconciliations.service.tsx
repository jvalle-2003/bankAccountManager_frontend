import { Reconciliation } from '@/types';
import api from '../utils/endpointApi'; 

const ENDPOINT = '/periods';


// Función para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const reconciliationsService = {
    async getAll(): Promise<Reconciliation[]> {
        const response = await api.get(ENDPOINT);
        return response.data;
    },

    async getById(id: number): Promise<Reconciliation> {
        const response = await api.get(`${ENDPOINT}/${id}`);
        return response.data;
    },

    async create(data: Omit<Reconciliation, 'reconciliation_id'>): Promise<Reconciliation> {
        const response = await api.post(ENDPOINT, data);
        return response.data;
    },

    async update(id: number, data: Partial<Reconciliation>): Promise<Reconciliation> {
        const response = await api.put(`${ENDPOINT}/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${ENDPOINT}/${id}`);
    }
};