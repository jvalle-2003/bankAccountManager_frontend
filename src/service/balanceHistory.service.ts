import { BalanceHistory } from '@/types';
import api from '../utils/endpointApi'; 

// Simplificamos el endpoint base usando la instancia 'api' configurada
const ENDPOINT = '/balance-history';

// Helper centralizado para inyectar headers y cookies obligatorias
const getRequestConfig = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
        headers: {
            Authorization: `Bearer ${token}`
        },
        withCredentials: true // Permite la transmisión de Cookies HttpOnly requerida por el backend
    };
};

export const balanceHistoryService = {
    // ── CRUD Básico ─────────────────────────────────────────────────────────

    async getAll(): Promise<BalanceHistory[]> {
        const response = await api.get(`${ENDPOINT}`, getRequestConfig());
        return response.data;
    },

    async getById(id: number): Promise<BalanceHistory> {
        const response = await api.get(`${ENDPOINT}/${id}`, getRequestConfig());
        return response.data;
    },

    async create(data: Omit<BalanceHistory, 'history_id'>): Promise<BalanceHistory> {
        const response = await api.post(`${ENDPOINT}`, data, getRequestConfig());
        return response.data;
    },

    async update(id: number, data: Partial<BalanceHistory>): Promise<BalanceHistory> {
        const response = await api.put(`${ENDPOINT}/${id}`, data, getRequestConfig());
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`${ENDPOINT}/${id}`, getRequestConfig());
    },

    // ── Cierre de Mes ────────────────────────────────────────────────────────

    /**
     * Calcular y guardar cierre de mes para una cuenta específica
     */
    async calculateMonthlyClosing(data: { 
        account_id: number; 
        year: number; 
        month: number; 
        closed_by?: number 
    }): Promise<{
        success: boolean;
        message: string;
        data?: {
            history_id: number;
            account_id: number;
            balance_date: string;
            closing_balance: number;
            previous_balance: number;
            monthly_credits: number;
            monthly_debits: number;
            transaction_count: number;
        };
    }> {
        const response = await api.post(`${ENDPOINT}/calculate-closing`, data, getRequestConfig());
        return response.data;
    },

    /**
     * Ejecutar cierre de mes para TODAS las cuentas
     */
    async executeGlobalClosing(data: { 
        year: number; 
        month: number; 
        closed_by?: number 
    }): Promise<{
        success: boolean;
        total_accounts: number;
        successful: number;
        failed: number;
        results: any[];
        errors: any[];
    }> {
        const response = await api.post(`${ENDPOINT}/global-closing`, data, getRequestConfig());
        return response.data;
    },

    /**
     * Obtener cierre de un mes específico
     */
    async getMonthlyClosing(accountId: number, year: number, month: number): Promise<BalanceHistory | null> {
        try {
            const response = await api.get(`${ENDPOINT}/monthly-closing/${accountId}/${year}/${month}`, getRequestConfig());
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error en getMonthlyClosing:', error);
            return null;
        }
    },

    /**
     * Obtener historial de cierres de una cuenta
     */
    async getClosingHistory(accountId: number, limit: number = 12): Promise<BalanceHistory[]> {
        try {
            const response = await api.get(`${ENDPOINT}/closing-history/${accountId}?limit=${limit}`, getRequestConfig());
            return response.data.success ? response.data.data : [];
        } catch (error) {
            console.error('Error en getClosingHistory:', error);
            return [];
        }
    },

    /**
     * Obtener saldo inicial de un mes (cierre del mes anterior)
     */
    async getOpeningBalance(accountId: number, year: number, month: number): Promise<number> {
        try {
            const response = await api.get(`${ENDPOINT}/opening-balance/${accountId}/${year}/${month}`, getRequestConfig());
            return response.data.success ? response.data.data.opening_balance : 0;
        } catch (error) {
            console.error('Error en getOpeningBalance:', error);
            return 0;
        }
    },

    /**
     * Obtener saldo por fecha específica
     */
    async getBalanceByDate(
        accountId: number,
        balanceDate: string
    ): Promise<{
        account_id: number;
        balance_date: string;
        closing_balance: number;
    } | null> {
        try {
            const response = await api.get(`${ENDPOINT}/balance-by-date/${accountId}/${balanceDate}`, getRequestConfig());
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error en getBalanceByDate:', error);
            return null;
        }
    },

    /**
     * Obtener estado de cuenta completo para un mes
     */
    async getMonthlyStatement(
        accountId: number,
        year: number,
        month: number
    ): Promise<{
        account_id: number;
        period: {
            year: number;
            month: number;
            start_date: string;
            end_date: string;
        };
        opening_balance: number;
        closing_balance: number;
        summary: {
            total_credits: number;
            total_debits: number;
            transaction_count: number;
        };
        transactions: any[];
    } | null> {
        try {
            const response = await api.get(`${ENDPOINT}/statement/${accountId}/${year}/${month}`, getRequestConfig());
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error en getMonthlyStatement:', error);
            return null;
        }
    }
};