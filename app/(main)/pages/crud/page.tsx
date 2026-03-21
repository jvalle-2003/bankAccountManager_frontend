'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import React, { useEffect, useRef, useState } from 'react';
import { Demo } from '@/types';
import { BankAccountService } from '@/src/service/BankAccountService';
import { CurrencyService } from '@/src/service/currency.service';

const BankAccountsPage = () => {
    let emptyAccount = {
        account_id: null,
        bank_id: null,
        account_type_id: null,
        currency_id: 'GTQ',
        account_number: '',
        account_alias: '',
        initial_balance: 0,
        current_balance: 0
    };

    const [accounts, setAccounts] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [account, setAccount] = useState<any>(emptyAccount);
    const [accountDialog, setAccountDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);
    const [currencies, setCurrencies] = useState<any[]>([]);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            // Cargamos cuentas y también los catálogos para los Dropdowns
            const [accs, bnks, typs, currs] = await Promise.all([
                BankAccountService.getAccounts(),
                BankAccountService.getBanks(),
                BankAccountService.getAccountTypes(),
                CurrencyService.getAll()

            ]);
            setAccounts(accs);
            setBanks(bnks);
            setTypes(typs);
            setCurrencies(currs);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
        }
    };

    const saveAccount = async () => {
        try {
            if (!account.account_number || !account.bank_id || !account.account_alias) {
                toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
                return;
            }

            const dataToSave = { 
                ...account, 
                current_balance: account.account_id ? account.current_balance : account.initial_balance 
            };
            
            if (account.account_id) {
                await BankAccountService.updateAccount(account.account_id, dataToSave);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta Actualizada' });
            } else {
                await BankAccountService.createAccount(dataToSave);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta Creada' });
            }
            setAccountDialog(false);
            loadData();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar' });
        }
    };

    const confirmDelete = async () => {
        try {
            await BankAccountService.deleteAccount(account.account_id);
            setDeleteDialog(false);
            loadData();
            toast.current?.show({ severity: 'warn', summary: 'Desactivada', detail: 'Cuenta desactivada' });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al desactivar' });
        }
    };

    const currencyBodyTemplate = (rowData: any) => {
    const monedaEncontrada = currencies.find(c => c.id_currency === rowData.currency_id);
    return monedaEncontrada ? monedaEncontrada.name : rowData.currency_id;
};

    const actionBody = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => { setAccount(rowData); setAccountDialog(true); }} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setAccount(rowData); setDeleteDialog(true); }} />
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={() => (
                <Button label="Nueva Cuenta" icon="pi pi-plus" severity="success" onClick={() => { setAccount(emptyAccount); setAccountDialog(true); }} />
            )} />

            <DataTable value={accounts} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay cuentas registradas.">
    <Column field="account_alias" header="Nombre / Alias" sortable />
    <Column field="account_number" header="No. Cuenta" sortable />
    <Column field="Bank.bank_name" header="Banco" sortable />
    <Column field="AccountType.type_name" header="Tipo" sortable />
    <Column field="currency_id" header="Moneda" body={currencyBodyTemplate} sortable />
    <Column 
        field="current_balance" 
        header="Saldo Actual" 
        sortable 
        body={(rowData) => { 
            const monedaInfo = currencies.find(c => c.id_currency === rowData.currency_id);
            const simbolo = monedaInfo ? monedaInfo.symbol : 'Q';
            const locale = rowData.currency_id === 'USD' ? 'en-US' : 'es-GT'; 
            return (
                <span style={{ fontWeight: 'bold' }}>
                    {simbolo} {Number(rowData.current_balance).toLocaleString(locale, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    })}
                </span>
            );
        }} 
    />
    
    <Column body={actionBody} header="Acciones" />
</DataTable>

            <Dialog visible={accountDialog} style={{ width: '450px' }} header="Gestión de Cuenta Bancaria" modal className="p-fluid" onHide={() => setAccountDialog(false)}
                footer={<><Button label="Cancelar" icon="pi pi-times" text onClick={() => setAccountDialog(false)} /><Button label="Guardar" icon="pi pi-check" onClick={saveAccount} /></>}>
                
                <div className="field">
                    <label htmlFor="account_alias">Alias de la Cuenta</label>
                    <InputText id="account_alias" value={account.account_alias} onChange={(e) => setAccount({...account, account_alias: e.target.value})} placeholder="Ej: Ahorros Principal" required autoFocus />
                </div>

                <div className="field">
                    <label>Moneda</label>
                    <Dropdown value={account.currency_id} options={currencies} optionLabel={"name"} optionValue="id_currency" onChange={(e) => setAccount({...account, currency_id: e.value})} placeholder="Seleccione Moneda" />
                </div>

                <div className="field">
                    <label>Banco</label>
                    <Dropdown value={account.bank_id} options={banks} optionLabel="bank_name" optionValue="bank_id" onChange={(e) => setAccount({...account, bank_id: e.value})} placeholder="Seleccione Banco" />
                </div>

                <div className="field">
                    <label>Tipo de Cuenta</label>
                    <Dropdown value={account.account_type_id} options={types} optionLabel="type_name" optionValue="account_type_id" onChange={(e) => setAccount({...account, account_type_id: e.value})} placeholder="Seleccione Tipo" />
                </div>

                <div className="field">
                    <label htmlFor="account_number">Número de Cuenta</label>
                    <InputText id="account_number" value={account.account_number} onChange={(e) => setAccount({...account, account_number: e.target.value})} placeholder="Ingrese el número" />
                </div>

                <div className="field">
                <label htmlFor="initial_balance">Saldo Inicial</label>
                <InputText 
                id="initial_balance" 
                value={account.initial_balance} 
                onChange={(e) => setAccount({...account, initial_balance: e.target.value})} 
                placeholder="Ej: 110000.00" 
                />
                </div>
            </Dialog>

            <Dialog visible={deleteDialog} header="Confirmar" modal onHide={() => setDeleteDialog(false)}
                footer={<><Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} /><Button label="Sí" icon="pi pi-check" severity="danger" onClick={confirmDelete} /></>}>
                ¿Desactivar cuenta <b>{account.account_alias}</b>?
            </Dialog>
        </div>
    );
};

export default BankAccountsPage;