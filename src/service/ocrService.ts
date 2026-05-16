import api from './api';

export interface OCRResponse {

    success: boolean;

    transactions: any[];

    bank?: string;

    accountType?: string;
}

export const OCRService = {

    async procesarEstadoCuenta(
        file: File,
        accountId: number
    ): Promise<OCRResponse> {

        const formData = new FormData();

        formData.append(
            'estado_cuenta',
            file
        );

        formData.append(
            'accountId',
            String(accountId)
        );

        const response = await api.post(
            '/ocr/reconciliar-ocr',
            formData,
            {
                headers: {
                    'Content-Type':
                        'multipart/form-data'
                }
            }
        );

        return response.data;
    }
};