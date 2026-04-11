import axios from 'axios';

const API_BASE = 'https://api.frankfurter.dev/v2/rate/USD';

export const CurrencyApiService = {
    async getLiveRates() {
        try {
            // Hacemos todas las peticiones en paralelo para que sea rápido
            const [resGTQ, resMXN, resHNL, resNIO, resCRC] = await Promise.all([
                axios.get(`${API_BASE}/GTQ`),
                axios.get(`${API_BASE}/MXN`),
                axios.get(`${API_BASE}/HNL`),
                axios.get(`${API_BASE}/NIO`),
                axios.get(`${API_BASE}/CRC`)
            ]);

            // Extraemos los valores individuales (tal como te funcionó con GTQ)
            const gtq = resGTQ.data.rate;
            const mxn = resMXN.data.rate;
            const hnl = resHNL.data.rate;
            const nio = resNIO.data.rate;
            const crc = resCRC.data.rate;

            return {
                // Conversiones de USD a Moneda Local
                USD_to_GTQ: gtq,
                USD_to_MXN: mxn,
                USD_to_HNL: hnl,
                USD_to_NIO: nio,
                USD_to_CRC: crc,
                // Conversiones de Moneda Local a USD
                GTQ_to_USD: 1 / gtq,
                MXN_to_USD: 1 / mxn,
                HNL_to_USD: 1 / hnl,
                NIO_to_USD: 1 / nio,
                CRC_to_USD: 1 / crc
            };
        } catch (error) {
            console.error("Error en API:", error);
            throw error; // Esto permite que el componente maneje el error
        }
    }
};