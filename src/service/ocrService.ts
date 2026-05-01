// service/ocr.service.ts
import axios from 'axios'; // O usar fetch si prefieres

export const OCRService = {
    async procesarEstadoCuenta(file: File) {
        const formData = new FormData();
        formData.append('estado_cuenta', file);

        try {
            // Ajusta la URL a tu endpoint de Node.js
            const response = await axios.post('http://localhost:3001/api/ocr/reconciliar-ocr', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error("Error en OCRService:", error);
            throw error;
        }
    }
};