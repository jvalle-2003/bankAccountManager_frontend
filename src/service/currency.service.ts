const API_URL = 'http://localhost:3001/api/currencies';

export const CurrencyService = {
    async getAll() {
        const res = await fetch(API_URL);
        return await res.json();
    },

    async create(data: any) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        return await res.json();
    },

    async update(id: string, data: any) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        return await res.json();
    },

    async delete(id: string) {
        await fetch(`${API_URL}/${id}/toggle`, {
            method: 'PATCH'
        });
    }
};
