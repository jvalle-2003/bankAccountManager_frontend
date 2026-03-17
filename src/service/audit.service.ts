const API_URL = 'http://localhost:3001/api/audits';

export const AuditService = {
    async getAll() {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Error al obtener auditorías");
        return await res.json();
    },
    // Nota: Normalmente no hay 'create' o 'update' manual para auditorías
    async delete(id: number) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    }
};