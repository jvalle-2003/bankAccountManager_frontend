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
import { BankAccountService } from '@/src/service/BankAccountService';
import { CurrencyService } from '@/src/service/currency.service';
// IMPORTACIÓN DE TU SERVICIO DE API EXTERNA
import { CurrencyApiService } from '@/src/service/currencyApi.service';

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
    
    const [exchangeRates, setExchangeRates] = useState<any>({ 
        USD_to_GTQ: 0, 
        GTQ_to_USD: 0,
        HNL_to_USD: 0,
        MXN_to_USD: 0,
        NIO_to_USD: 0 
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [accs, bnks, typs, currs, rates] = await Promise.all([
                BankAccountService.getAccounts(),
                BankAccountService.getBanks(),
                BankAccountService.getAccountTypes(),
                CurrencyService.getAll(),
                CurrencyApiService.getLiveRates()
            ]);
            setAccounts(accs);
            setBanks(bnks);
            setTypes(typs);
            setCurrencies(currs);
            setExchangeRates(rates);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
        }
    };

    const rateBodyTemplate = (rowData: any) => {
        const moneda = currencies.find(c => c.id_currency === rowData.currency_id);
        const simbolo = moneda?.symbol || '';

        if (!exchangeRates.USD_to_GTQ) return <span>Cargando...</span>;

        switch (simbolo) {
            case '$':
                return <span className="text-blue-600 font-bold">Q {exchangeRates.USD_to_GTQ.toFixed(2)}</span>;
            case 'Q':
                return <span className="text-green-600 font-bold">$ {exchangeRates.GTQ_to_USD.toFixed(4)}</span>;
            case 'L':
                return <span className="text-orange-600 font-bold">$ {exchangeRates.HNL_to_USD.toFixed(4)}</span>;
            case 'MX$':
                return <span className="text-red-600 font-bold">$ {exchangeRates.MXN_to_USD.toFixed(4)}</span>;
            case 'C$':
                return <span className="text-indigo-600 font-bold">$ {exchangeRates.NIO_to_USD.toFixed(4)}</span>;
            default:
                return <span className="text-500">Sin tasa</span>;
        }
    };

    const equivalentBalanceTemplate = (rowData: any) => {
        const saldo = Number(rowData.current_balance || 0);
        const moneda = currencies.find(c => c.id_currency === rowData.currency_id);
        const simbolo = moneda?.symbol || '';

        if (!exchangeRates.USD_to_GTQ) return <span>---</span>;

        let conversion = 0;
        let simboloDestino = '$';
        let colorClass = 'text-green-600';
        let locale = 'en-US';

        switch (simbolo) {
            case '$':
                conversion = saldo * exchangeRates.USD_to_GTQ;
                simboloDestino = 'Q';
                colorClass = 'text-blue-500';
                locale = 'es-GT';
                break;
            case 'Q':
                conversion = saldo * exchangeRates.GTQ_to_USD;
                break;
            case 'L':
                conversion = saldo * exchangeRates.HNL_to_USD;
                break;
            case 'MX$':
                conversion = saldo * exchangeRates.MXN_to_USD;
                break;
            case 'C$':
                conversion = saldo * exchangeRates.NIO_to_USD;
                break;
            default:
                return <span className="text-500">---</span>;
        }

        return (
            <span className={`${colorClass} font-medium`}>
                {simboloDestino} {conversion.toLocaleString(locale, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                })}
            </span>
        );
    };

    const saveAccount = async () => {
        try {
            if (!account.account_number || !account.bank_id || !account.account_alias) {
                toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Complete los campos obligatorios' });
                return;
            }

            // CORRECCIÓN: Al guardar (crear o editar), igualamos el saldo actual al inicial
            // para que los cambios en el formulario se reflejen en la base de datos.
            const dataToSave = { 
                ...account, 
                current_balance: account.initial_balance 
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
            <Toolbar className="mb-4" 
                left={() => (
                    <Button label="Nueva Cuenta" icon="pi pi-plus" severity="success" onClick={() => { setAccount(emptyAccount); setAccountDialog(true); }} />
                )} 
                right={() => (
                    <div className="p-2 border-round bg-primary-reverse font-bold text-sm shadow-1">
                        Ref. Hoy: 1 USD = Q {exchangeRates.USD_to_GTQ.toFixed(2)}
                    </div>
                )}
            />

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

                <Column header="Tasa de Cambio" body={rateBodyTemplate} />
                <Column header="Equivalente" body={equivalentBalanceTemplate} />
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
                    <label htmlFor="initial_balance">Saldo Inicial / Actual</label>
                    <InputText id="initial_balance" value={account.initial_balance} onChange={(e) => setAccount({...account, initial_balance: e.target.value})} placeholder="Ej: 110000.00" />
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