/**
 * bankMapper.js - Lógica Universal
 */

const bankMapper = {
    // 1. Extraer cualquier número que parezca una cuenta bancaria
    // Busca secuencias de números largas (7 a 20 dígitos) con o sin guiones
    findPotentialAccounts: (text : string) => {
        const pattern = /\b\d[\d-]{6,18}\d\b/g;
        const matches = text.match(pattern) || [];
        // Limpiamos los guiones para comparar el número puro
        return matches.map(acc => acc.replace(/-/g, ''));
    },

    // 2. Extractor Universal de Filas
    // Busca el patrón común de los estados de cuenta: Fecha + Texto + Monto
    extractUniversalTransactions: (lines : string[]) => {
        return lines.map(line => {
            // Regex que busca:
            // (Fecha DD/MM/YYYY o DD-MM-YYYY) + (Cualquier texto) + (Monto con decimales)
            const regex = /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.*?)\s+(-?[\d,]+\.\d{2})/;
            const m = line.match(regex);
            
            if (m) {
                return {
                    date: m[1],
                    description: m[2].trim(),
                    amount: parseFloat(m[3].replace(/,/g, ''))
                };
            }
            return null;
        }).filter(Boolean);
    }
};

module.exports = bankMapper;