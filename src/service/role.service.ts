const API_URL = 'http://localhost:3001/api/roles';

// Función para obtener headers con token
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const RoleService = {
    async getAll() {
        const res = await fetch(API_URL, {
            headers: getAuthHeaders()
        });
        return await res.json();
    },

    async create(data: any) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async update(id: number, data: any) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async delete(id: number) {
        await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    }
};