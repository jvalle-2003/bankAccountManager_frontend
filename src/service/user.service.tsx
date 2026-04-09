import axios from 'axios';

const API_URL = 'http://localhost:3001/api/users';

export const UserService = {
    getAll: async () => {
        const res = await axios.get(API_URL);
        return res.data;
    },
    create: async (data: any) => {
        const res = await axios.post(API_URL, data);
        return res.data;
    },
    update: async (id: number, data: any) => {
        const res = await axios.put(`${API_URL}/${id}`, data);
        return res.data;
    },
    delete: async (id: number) => {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    }
};