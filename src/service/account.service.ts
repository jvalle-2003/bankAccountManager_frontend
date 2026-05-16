import api from './api';

export interface Account {

    account_id: number;

    account_number: string;

    account_alias: string;
}

export const AccountService = {

    async getAccounts():
        Promise<Account[]> {

        const response =
            await api.get('/bank-accounts');

        return response.data;
    }
};