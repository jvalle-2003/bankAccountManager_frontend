const API_URL = 'http://localhost:3001/api/users';

export const UserService = {
    async getAll() {
        const res = await fetch(API_URL);
        return await res.json();
    },
    async create(data: any) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    async update(id: number, data: any) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },
    async delete(id: number) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    }
};