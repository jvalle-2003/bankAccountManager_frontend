import axios from 'axios';

const API_URL = 'http://localhost:3001/api/roles';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`
        // El 'Content-Type' ya no es necesario ponerlo manualmente en Axios
    };
};

export const RoleService = {
    async getAll() {
        const res = await axios.get(API_URL, { headers: getAuthHeaders() });
        return res.data;
    },

    async create(data: any) {
        const res = await axios.post(API_URL, data, { headers: getAuthHeaders() });
        return res.data;
    },

    async update(id: number, data: any) {
        const res = await axios.put(`${API_URL}/${id}`, data, { headers: getAuthHeaders() });
        return res.data;
    },

    async delete(id: number) {
        await axios.delete(`${API_URL}/${id}`, { headers: getAuthHeaders() });
    }
};