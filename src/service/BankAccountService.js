import axios from 'axios';

// URL base de tu backend (cámbiala si es diferente)
const API_URL = 'http://localhost:3000/api'; 

export const BankAccountService = {
    // ==========================================
    // CRUD para CUENTAS BANCARIAS (Ya lo tenías)
    // ==========================================
    getAccounts: async () => {
        const res = await axios.get(`${API_URL}/bank-accounts`);
        return res.data;
    },
    createAccount: async (data) => {
        const res = await axios.post(`${API_URL}/bank-accounts`, data);
        return res.data;
    },
    updateAccount: async (id, data) => {
        const res = await axios.put(`${API_URL}/bank-accounts/${id}`, data);
        return res.data;
    },
    // Este método debería ser para el borrado definitivo.
    // Si usas borrado lógico (active: false), tu backend debe manejarlo en el PUT.
    deleteAccount: async (id) => {
        const res = await axios.delete(`${API_URL}/bank-accounts/${id}`);
        return res.data;
    },

    // ==========================================
    // CRUD completo para BANCOS
    // ==========================================
    getBanks: async () => { // Este ya lo tenías
        const res = await axios.get(`${API_URL}/banks`);
        return res.data;
    },
    createBank: async (data) => { // NUEVO
        const res = await axios.post(`${API_URL}/banks`, data);
        return res.data;
    },
    updateBank: async (id, data) => { // NUEVO
        const res = await axios.put(`${API_URL}/banks/${id}`, data);
        return res.data;
    },
    deleteBank: async (id) => { // NUEVO
        const res = await axios.delete(`${API_URL}/banks/${id}`);
        return res.data;
    },

    // ==========================================
    // CRUD completo para TIPOS DE CUENTA
    // ==========================================
    getAccountTypes: async () => { // Este ya lo tenías
        const res = await axios.get(`${API_URL}/account-types`);
        return res.data;
    },
    createAccountType: async (data) => { // NUEVO
        const res = await axios.post(`${API_URL}/account-types`, data);
        return res.data;
    },
    updateAccountType: async (id, data) => { // NUEVO
        const res = await axios.put(`${API_URL}/account-types/${id}`, data);
        return res.data;
    },
    deleteAccountType: async (id) => { // NUEVO
        const res = await axios.delete(`${API_URL}/account-types/${id}`);
        return res.data;
    }
};