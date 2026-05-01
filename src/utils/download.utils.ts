/**
 * Descarga un archivo desde una URL dada.
 * @param url - La ruta del endpoint en tu backend (ej. /api/users/report/export?format=excel)
 * @param filename - El nombre base que quieres darle al archivo al descargarse
 * @param format - 'excel', 'pdf' o 'csv'
 */
export const downloadFileFromBackend = async (url: string, filename: string, format: 'excel' | 'pdf' | 'csv') => {
    try {
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Asignar la extensión correcta
        let extension = 'pdf';
        if (format === 'excel') extension = 'xlsx';
        if (format === 'csv') extension = 'csv';
        
        a.href = objectUrl;
        a.download = `${filename}_${new Date().getTime()}.${extension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(objectUrl);
        
        return true; // Retornamos true si fue exitoso
    } catch (error) {
        console.error("Error en downloadFileFromBackend:", error);
        throw error; // Lanzamos el error para que el componente lo maneje (ej. mostrar toast)
    }
};