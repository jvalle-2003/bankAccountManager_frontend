import api from './api';

export const StatementService = {

    async downloadExcel(
        transactions: any[],
        accountId: number
    ) {

        return api.post(
            '/statements/download-excel',
            {
                transactions,
                accountId
            },
            {
                responseType: 'blob'
            }
        );
    }
};