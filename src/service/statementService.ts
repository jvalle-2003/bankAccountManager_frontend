import axios from 'axios';

// Cambia la URL si tu puerto es diferente
const API_URL = 'http://localhost:3001/api/statements';

export const StatementService = {
    /**
     * Envía el PDF al backend para procesamiento dinámico
     */
    processStatement: async (file: File) => {
        const formData = new FormData();
        formData.append('statement', file); // 'statement' debe coincidir con el backend

        try {
            const response = await axios.post(`${API_URL}/process`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error en StatementService:", error);
            throw error;
        }
    }
};