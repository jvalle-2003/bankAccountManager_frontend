import api from '../utils/endpointApi';

export const BankAccountService = {
    // ==========================================
    // CRUD para CUENTAS BANCARIAS (Ya lo tenías)
    // ==========================================
    getAccounts: async () => {
        const res = await api.get('/bank-accounts');
        return res.data;
    },
    createAccount: async (data) => {
        const res = await api.post('/bank-accounts', data);
        return res.data;
    },
    updateAccount: async (id, data) => {
        const res = await api.put(`/bank-accounts/${id}`, data);
        return res.data;
    },
    // Este método debería ser para el borrado definitivo.
    // Si usas borrado lógico (active: false), tu backend debe manejarlo en el PUT.
    deleteAccount: async (id) => {
        const res = await api.delete(`/bank-accounts/${id}`);
        return res.data;
    },

    // ==========================================
    // CRUD completo para BANCOS
    // ==========================================
    getBanks: async () => { // Este ya lo tenías
        const res = await api.get(`/banks`);
        return res.data;
    },
    createBank: async (data) => { // NUEVO
        const res = await api.post(`/banks`, data);
        return res.data;
    },
    updateBank: async (id, data) => { // NUEVO
        const res = await api.put(`/banks/${id}`, data);
        return res.data;
    },
    deleteBank: async (id) => { // NUEVO
        const res = await api.delete(`/banks/${id}`);
        return res.data;
    },

    // ==========================================
    // CRUD completo para TIPOS DE CUENTA
    // ==========================================
    getAccountTypes: async () => { // Este ya lo tenías
        const res = await api.get(`/account-types`);
        return res.data;
    },
    createAccountType: async (data) => { // NUEVO
        const res = await api.post(`/account-types`, data);
        return res.data;
    },
    updateAccountType: async (id, data) => { // NUEVO
        const res = await api.put(`/account-types/${id}`, data);
        return res.data;
    },
    deleteAccountType: async (id) => { // NUEVO
        const res = await api.delete(`/account-types/${id}`);
        return res.data;
    }
};