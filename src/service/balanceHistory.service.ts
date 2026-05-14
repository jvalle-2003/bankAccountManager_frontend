// src/service/balanceHistory.service.ts

import axios from 'axios';
import { BalanceHistory } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Función para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const balanceHistoryService = {
    // ── CRUD Básico ─────────────────────────────────────────────────────────

    async getAll(): Promise<BalanceHistory[]> {
        const response = await axios.get(`${API_URL}/balance-history`, getAuthHeaders());
        return response.data;
    },

    async getById(id: number): Promise<BalanceHistory> {
        const response = await axios.get(`${API_URL}/balance-history/${id}`, getAuthHeaders());
        return response.data;
    },

    async create(data: Omit<BalanceHistory, 'history_id'>): Promise<BalanceHistory> {
        const response = await axios.post(`${API_URL}/balance-history`, data, getAuthHeaders());
        return response.data;
    },

    async update(id: number, data: Partial<BalanceHistory>): Promise<BalanceHistory> {
        const response = await axios.put(`${API_URL}/balance-history/${id}`, data, getAuthHeaders());
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await axios.delete(`${API_URL}/balance-history/${id}`, getAuthHeaders());
    },

    // ── Cierre de Mes ────────────────────────────────────────────────────────

    /**
     * Calcular y guardar cierre de mes para una cuenta específica
     */
    async calculateMonthlyClosing(data: { account_id: number; year: number; month: number; closed_by?: number }): Promise<{
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
        const response = await axios.post(`${API_URL}/balance-history/calculate-closing`, data, getAuthHeaders());
        return response.data;
    },

    /**
     * Ejecutar cierre de mes para TODAS las cuentas
     */
    async executeGlobalClosing(data: { year: number; month: number; closed_by?: number }): Promise<{
        success: boolean;
        total_accounts: number;
        successful: number;
        failed: number;
        results: any[];
        errors: any[];
    }> {
        const response = await axios.post(`${API_URL}/balance-history/global-closing`, data, getAuthHeaders());
        return response.data;
    },

    /**
     * Obtener cierre de un mes específico
     */
    // balanceHistory.service.ts

    async getMonthlyClosing(accountId: number, year: number, month: number): Promise<BalanceHistory | null> {
        try {
            // ✅ URL correcta - debe coincidir con la ruta del backend
            const response = await axios.get(`${API_URL}/balance-history/monthly-closing/${accountId}/${year}/${month}`, getAuthHeaders());
            console.log('Respuesta getMonthlyClosing:', response.data);
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
            const response = await axios.get(`${API_URL}/balance-history/closing-history/${accountId}?limit=${limit}`, getAuthHeaders());
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
            const response = await axios.get(`${API_URL}/balance-history/opening-balance/${accountId}/${year}/${month}`, getAuthHeaders());
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
            const response = await axios.get(`${API_URL}/balance-history/balance-by-date/${accountId}/${balanceDate}`, getAuthHeaders());
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
            const response = await axios.get(`${API_URL}/balance-history/statement/${accountId}/${year}/${month}`, getAuthHeaders());
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error en getMonthlyStatement:', error);
            return null;
        }
    }
};
