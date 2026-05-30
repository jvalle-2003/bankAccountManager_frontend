'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar'; // Importar Calendar
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { BankAccountService } from '@/src/service/BankAccountService';
import { CurrencyService } from '@/src/service/currency.service';
import { CurrencyApiService } from '@/src/service/currencyApi.service';

const BankAccountsPage = () => {
    let emptyAccount = {
        account_id: null,
        bank_id: null,
        account_type_id: null,
        currency_id: null,
        account_number: '',
        account_alias: '',
        initial_balance: 0,
        current_balance: 0,
        created_at: new Date().toISOString() // Cambiar a formato ISO string
    };

    const [accounts, setAccounts] = useState<any[]>([]);
    const [banks, setBanks] = useState<any[]>([]);
    const [types, setTypes] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [account, setAccount] = useState<any>(emptyAccount);
    const [accountDialog, setAccountDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useRef<Toast>(null);

    const [exchangeRates, setExchangeRates] = useState<any>({
        USD_to_GTQ: 0,
        GTQ_to_USD: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [accs, bnks, typs, currs, rates] = await Promise.all([BankAccountService.getAccounts(), BankAccountService.getBanks(), BankAccountService.getAccountTypes(), CurrencyService.getAll(), CurrencyApiService.getLiveRates()]);
            setAccounts(accs);
            setBanks(bnks);
            setTypes(typs);
            setCurrencies(currs);
            setExchangeRates(rates);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar datos' });
        }
    };

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    // Obtener el símbolo de la moneda seleccionada
    const getCurrencySymbol = (currencyId: number): string => {
        const currency = currencies.find((c) => String(c.id_currency) === String(currencyId));
        return currency?.symbol || '';
    };

    // Validar si la moneda es Quetzal (GTQ)
    const isQuetzal = (currencyId: number): boolean => {
        const symbol = getCurrencySymbol(currencyId);
        return symbol === 'Q';
    };

    // Validar si la moneda es Dólar (USD)
    const isDollar = (currencyId: number): boolean => {
        const symbol = getCurrencySymbol(currencyId);
        return symbol === '$';
    };

    // ==========================================
    // VALIDACIONES DE CAMPOS
    // ==========================================

    // Validación: Solo letras, espacios y acentos para el alias
    const onAccountAliasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const regex = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]*$/;
        if (regex.test(val) || val === '') {
            setAccount({ ...account, account_alias: val });
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Formato inválido', detail: 'El alias solo puede contener letras y espacios', life: 2000 });
        }
    };

    // Validación: Solo números y guiones para el número de cuenta
    const onAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const regex = /^[0-9-]*$/;
        if (regex.test(val)) {
            setAccount({ ...account, account_number: val });
        } else {
            toast.current?.show({ severity: 'warn', summary: 'Formato inválido', detail: 'Solo números y guiones', life: 2000 });
        }
    };

    // Validación de saldo inicial según el tipo de moneda
    const onInitialBalanceChange = (e: { value: number | null }) => {
        const val = e.value || 0;
        const currencySymbol = getCurrencySymbol(account.currency_id);

        // Definir límites según la moneda
        const maxBalance = currencySymbol === 'Q' ? 10000000 : 1000000; // Q10M o $1M

        if (val < 0) {
            toast.current?.show({ severity: 'warn', summary: 'Saldo inválido', detail: 'El saldo inicial no puede ser negativo', life: 2000 });
            setAccount({ ...account, initial_balance: 0 });
        } else if (val > maxBalance) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Saldo excedido',
                detail: `El saldo inicial no puede superar ${currencySymbol}${maxBalance.toLocaleString('es-GT')}`,
                life: 2000
            });
            setAccount({ ...account, initial_balance: maxBalance });
        } else {
            setAccount({ ...account, initial_balance: val });
        }
    };

    // Validación de fecha: no puede ser futura
    const validateCreationDate = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date > today) {
            toast.current?.show({
                severity: 'error',
                summary: 'Fecha inválida',
                detail: 'La fecha de creación no puede ser futura',
                life: 3000
            });
            return false;
        }
        return true;
    };

    // Validación: Longitud para número de cuenta
    const validateAccountNumberLength = (number: string): boolean => {
        const cleanNumber = number.replace(/-/g, '');
        if (cleanNumber.length < 8) {
            toast.current?.show({ severity: 'error', summary: 'Número inválido', detail: 'El número de cuenta debe tener al menos 8 dígitos', life: 3000 });
            return false;
        }
        if (cleanNumber.length > 20) {
            toast.current?.show({ severity: 'error', summary: 'Número inválido', detail: 'El número de cuenta no puede superar los 20 dígitos', life: 3000 });
            return false;
        }
        return true;
    };

    // Validación: Longitud del alias
    const validateAliasLength = (alias: string): boolean => {
        if (alias.length < 3) {
            toast.current?.show({ severity: 'error', summary: 'Alias muy corto', detail: 'El alias debe tener al menos 3 caracteres', life: 3000 });
            return false;
        }
        if (alias.length > 50) {
            toast.current?.show({ severity: 'error', summary: 'Alias muy largo', detail: 'El alias no puede superar los 50 caracteres', life: 3000 });
            return false;
        }
        return true;
    };

    // Validación: Evitar palabras restringidas en alias
    const validateAliasContent = (alias: string): boolean => {
        const forbiddenWords = ['admin', 'root', 'test', 'prueba', 'dummy', 'sistema'];
        const lowerAlias = alias.toLowerCase();
        for (const word of forbiddenWords) {
            if (lowerAlias.includes(word)) {
                toast.current?.show({ severity: 'error', summary: 'Alias no permitido', detail: `El alias no puede contener la palabra "${word}"`, life: 3000 });
                return false;
            }
        }
        return true;
    };

    // Validación: Verificar si el número de cuenta ya existe (duplicado)
    const checkDuplicateAccountNumber = (accountNumber: string, currentAccountId: number | null): boolean => {
        const isDuplicate = accounts.some((acc) => acc.account_number.trim() === accountNumber.trim() && acc.account_id !== currentAccountId);

        if (isDuplicate) {
            toast.current?.show({ severity: 'error', summary: 'Cuenta duplicada', detail: 'El número de cuenta ya existe en el sistema', life: 3000 });
            return true;
        }
        return false;
    };

    // Validación de saldo máximo permitido por tipo de cuenta y moneda
    const validateBalanceLimit = (balance: number, accountTypeId: number, currencyId: number): boolean => {
        const currencySymbol = getCurrencySymbol(currencyId);
        const isQuetzalAccount = currencySymbol === 'Q';

        // Límites en Quetzales
        const limitsGTQ: { [key: number]: number } = {
            1: 500000, // Cuenta de ahorro: Q500,000
            2: 2000000, // Cuenta corriente: Q2,000,000
            3: 5000000 // Cuenta empresarial: Q5,000,000
        };

        // Límites en Dólares
        const limitsUSD: { [key: number]: number } = {
            1: 50000, // Cuenta de ahorro: $50,000
            2: 200000, // Cuenta corriente: $200,000
            3: 500000 // Cuenta empresarial: $500,000
        };

        const limits = isQuetzalAccount ? limitsGTQ : limitsUSD;
        const limit = limits[accountTypeId];
        const currencySymbolDisplay = isQuetzalAccount ? 'Q' : '$';

        if (limit && balance > limit) {
            toast.current?.show({
                severity: 'error',
                summary: 'Límite excedido',
                detail: `El saldo no puede exceder ${currencySymbolDisplay}${limit.toLocaleString('es-GT')} para este tipo de cuenta en ${isQuetzalAccount ? 'Quetzales' : 'Dólares'}`,
                life: 3000
            });
            return false;
        }
        return true;
    };

    // Validación: No permitir espacios al inicio o final
    const sanitizeAndValidateInputs = (): boolean => {
        const trimmedAlias = account.account_alias?.trim();
        const trimmedNumber = account.account_number?.trim();

        if (trimmedAlias !== account.account_alias) {
            toast.current?.show({ severity: 'warn', summary: 'Formato inválido', detail: 'El alias no debe tener espacios al inicio o final', life: 2000 });
            return false;
        }

        if (trimmedNumber !== account.account_number) {
            toast.current?.show({ severity: 'warn', summary: 'Formato inválido', detail: 'El número de cuenta no debe tener espacios al inicio o final', life: 2000 });
            return false;
        }

        return true;
    };

    // Validación de consistencia de moneda al editar
    const validateCurrencyConsistency = (): boolean => {
        if (account.account_id && account.currency_id) {
            const originalAccount = accounts.find((acc) => acc.account_id === account.account_id);
            if (originalAccount && originalAccount.currency_id !== account.currency_id) {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Moneda no modificable',
                    detail: 'No se puede cambiar la moneda de una cuenta existente. Las transacciones ya registradas dependen de esta moneda.',
                    life: 5000
                });
                return false;
            }
        }
        return true;
    };

    // ==========================================
    // GUARDADO CON TODAS LAS VALIDACIONES
    // ==========================================
    const saveAccount = async () => {
        setSubmitted(true);

        // Validación de campos obligatorios (incluyendo created_at)
        if (!account.account_number || !account.bank_id || !account.account_alias || !account.account_type_id || !account.currency_id || !account.created_at) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Complete todos los campos obligatorios' });
            return;
        }

        // Validar fecha de creación
        const selectedDate = new Date(account.created_at);
        if (!validateCreationDate(selectedDate)) return;

        // Validar que no se cambie la moneda en edición
        if (!validateCurrencyConsistency()) return;

        // Validación de espacios al inicio/final
        if (!sanitizeAndValidateInputs()) return;

        // Validación de alias (solo letras)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(account.account_alias)) {
            toast.current?.show({ severity: 'error', summary: 'Alias inválido', detail: 'El alias solo puede contener letras y espacios' });
            return;
        }

        // Validación de longitud de alias
        if (!validateAliasLength(account.account_alias)) return;

        // Validación de contenido de alias
        if (!validateAliasContent(account.account_alias)) return;

        // Validación de longitud del número de cuenta
        if (!validateAccountNumberLength(account.account_number)) return;

        // Validación de duplicado
        if (checkDuplicateAccountNumber(account.account_number, account.account_id)) return;

        // Validación de saldo máximo (considerando tipo de moneda)
        if (!validateBalanceLimit(account.initial_balance, account.account_type_id, account.currency_id)) return;

        // Validación de saldo inicial positivo
        if (account.initial_balance < 0) {
            toast.current?.show({ severity: 'error', summary: 'Saldo inválido', detail: 'El saldo inicial no puede ser negativo' });
            return;
        }

        // Validación de que el saldo inicial no tenga más de 2 decimales
        const decimalCount = (account.initial_balance.toString().split('.')[1] || '').length;
        if (decimalCount > 2) {
            toast.current?.show({ severity: 'error', summary: 'Saldo inválido', detail: 'El saldo no puede tener más de 2 decimales' });
            return;
        }

        try {
            // *** CORRECCIÓN IMPORTANTE: Formatear la fecha correctamente ***
            const dataToSave = {
                ...account,
                current_balance: account.initial_balance,
                created_at: account.created_at ? new Date(account.created_at).toISOString() : new Date().toISOString()
                // toISOString() devuelve formato: 2024-01-15T00:00:00.000Z
            };

            if (account.account_id) {
                await BankAccountService.updateAccount(account.account_id, dataToSave);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta Actualizada' });
            } else {
                await BankAccountService.createAccount(dataToSave);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Cuenta Creada' });
            }
            setAccountDialog(false);
            setSubmitted(false);
            loadData();
        } catch (e: any) {
            console.error('Error al guardar:', e);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: e.response?.data?.message || 'Error al guardar la cuenta'
            });
        }
    };

    const confirmDelete = async () => {
        // Validación adicional: No permitir eliminar cuentas con saldo diferente de 0
        if (account.current_balance !== 0) {
            const currencySymbol = getCurrencySymbol(account.currency_id);
            toast.current?.show({
                severity: 'warn',
                summary: 'No se puede desactivar',
                detail: `La cuenta debe tener saldo cero (${currencySymbol}0.00) antes de desactivarse`
            });
            return;
        }

        try {
            await BankAccountService.deleteAccount(account.account_id);
            setDeleteDialog(false);
            loadData();
            toast.current?.show({ severity: 'warn', summary: 'Desactivada', detail: 'Cuenta desactivada' });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al desactivar' });
        }
    };

    // ==========================================
    // RENDERIZADO DE COMPONENTES
    // ==========================================

    const rateBodyTemplate = (rowData: any) => {
        const monedaInfo = currencies.find((c) => String(c.id_currency) === String(rowData.currency_id));
        const simbolo = monedaInfo?.symbol || '';

        if (!exchangeRates.USD_to_GTQ) return <span>Cargando...</span>;

        if (simbolo === 'Q') {
            return <span className="text-green-600 font-bold">Moneda local (GTQ)</span>;
        } else if (simbolo === '$') {
            return <span className="text-blue-600 font-bold">Q {exchangeRates.USD_to_GTQ.toFixed(2)} por USD</span>;
        } else {
            return <span className="text-500">Sin tasa disponible</span>;
        }
    };

    const equivalentBalanceTemplate = (rowData: any) => {
        const saldo = Number(rowData.current_balance || 0);
        const monedaInfo = currencies.find((c) => String(c.id_currency) === String(rowData.currency_id));
        const simbolo = monedaInfo?.symbol || '';

        if (!exchangeRates.USD_to_GTQ || !monedaInfo) return <span>---</span>;

        let conversion = 0;
        let colorClass = 'text-green-600';

        if (simbolo === 'Q') {
            conversion = saldo;
            colorClass = 'text-green-600';
        } else if (simbolo === '$') {
            conversion = saldo * exchangeRates.USD_to_GTQ;
            colorClass = 'text-blue-600';
        } else {
            return <span className="text-500">---</span>;
        }

        return <span className={`${colorClass} font-medium`}>Q {conversion.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
    };

    const currencyBodyTemplate = (rowData: any) => {
        const moneda = currencies.find((c) => String(c.id_currency) === String(rowData.currency_id));
        return moneda ? `${moneda.name} (${moneda.symbol})` : rowData.currency_id;
    };

    // Template para mostrar la fecha formateada
    const dateBodyTemplate = (rowData: any) => {
        if (!rowData.created_at) return 'N/A';
        const date = new Date(rowData.created_at);
        return date.toLocaleDateString('es-GT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const actionBody = (rowData: any) => (
        <div className="flex gap-2">
            <Button
                icon="pi pi-pencil"
                rounded
                severity="success"
                onClick={() => {
                    setSubmitted(false);
                    setAccount(rowData);
                    setAccountDialog(true);
                }}
            />
            <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                onClick={() => {
                    setAccount(rowData);
                    setDeleteDialog(true);
                }}
            />
        </div>
    );

    // Custom template para mostrar el símbolo de moneda en el placeholder del InputNumber
    const getCurrencySymbolForBalance = (): string => {
        const symbol = getCurrencySymbol(account.currency_id);
        return symbol || 'Q';
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar
                className="mb-4"
                left={() => (
                    <Button
                        label="Nueva Cuenta"
                        icon="pi pi-plus"
                        severity="success"
                        onClick={() => {
                            setSubmitted(false);
                            setAccount(emptyAccount);
                            setAccountDialog(true);
                        }}
                    />
                )}
                right={() => <div className="p-2 border-round bg-primary-reverse font-bold text-sm shadow-1 text-primary">🇬🇹 Tipo de cambio: 1 USD = Q {exchangeRates.USD_to_GTQ?.toFixed(2) || '0.00'}</div>}
            />

            <DataTable value={accounts} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay cuentas registradas." sortField="account_alias" sortOrder={1}>
                <Column field="account_alias" header="Nombre de la Cuenta" sortable />
                <Column field="account_number" header="Número de Cuenta" sortable />
                <Column field="Bank.bank_name" header="Banco" sortable />
                <Column field="AccountType.type_name" header="Tipo de Cuenta" sortable />
                <Column field="currency_id" header="Moneda" body={currencyBodyTemplate} sortable />
                <Column
                    field="current_balance"
                    header="Saldo Actual"
                    sortable
                    body={(rowData) => {
                        const moneda = currencies.find((c) => String(c.id_currency) === String(rowData.currency_id));
                        const simbolo = moneda ? moneda.symbol : 'Q';
                        const cantidad = Number(rowData.current_balance);

                        return (
                            <span className="font-bold">
                                {simbolo} {cantidad.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        );
                    }}
                />
                <Column field="created_at" header="Fecha Creación" body={dateBodyTemplate} sortable />
                <Column header="Tasa de Cambio" body={rateBodyTemplate} />
                <Column header="Equivalente en Quetzales" body={equivalentBalanceTemplate} />
                <Column body={actionBody} header="Acciones" style={{ width: '120px' }} />
            </DataTable>

            <Dialog
                visible={accountDialog}
                style={{ width: '550px' }}
                header="Gestión de Cuenta Bancaria"
                modal
                className="p-fluid"
                onHide={() => setAccountDialog(false)}
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setAccountDialog(false)} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveAccount} />
                    </>
                }
            >
                <div className="field">
                    <label htmlFor="account_alias" className="font-bold">
                        Alias de la Cuenta <span className="text-red-500">*</span>
                    </label>
                    <InputText id="account_alias" value={account.account_alias} onChange={onAccountAliasChange} placeholder="Ej: Ahorros Personal" className={classNames({ 'p-invalid': submitted && !account.account_alias })} />
                    {submitted && !account.account_alias && <small className="p-error">El alias es requerido.</small>}
                    <small className="text-500">Solo letras y espacios (3-50 caracteres)</small>
                </div>

                <div className="grid">
                    <div className="col-6">
                        <div className="field">
                            <label className="font-bold">
                                Moneda <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={account.currency_id}
                                options={currencies}
                                optionLabel="name"
                                optionValue="id_currency"
                                onChange={(e) => {
                                    setAccount({ ...account, currency_id: e.value });
                                    // Resetear el saldo si cambia la moneda
                                    setAccount((prev: any) => ({ ...prev, initial_balance: 0 }));
                                }}
                                placeholder="Seleccione moneda"
                                className={classNames({ 'p-invalid': submitted && !account.currency_id })}
                                disabled={account.account_id !== null} // Deshabilitar en edición
                            />
                            {submitted && !account.currency_id && <small className="p-error">La moneda es requerida.</small>}
                            {account.account_id && <small className="text-500">La moneda no se puede modificar después de crear la cuenta</small>}
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="field">
                            <label className="font-bold">
                                Banco <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                value={account.bank_id}
                                options={banks}
                                optionLabel="bank_name"
                                optionValue="bank_id"
                                onChange={(e) => setAccount({ ...account, bank_id: e.value })}
                                placeholder="Seleccione banco"
                                className={classNames({ 'p-invalid': submitted && !account.bank_id })}
                            />
                            {submitted && !account.bank_id && <small className="p-error">El banco es requerido.</small>}
                        </div>
                    </div>
                </div>

                <div className="field">
                    <label className="font-bold">
                        Tipo de Cuenta <span className="text-red-500">*</span>
                    </label>
                    <Dropdown
                        value={account.account_type_id}
                        options={types}
                        optionLabel="type_name"
                        optionValue="account_type_id"
                        onChange={(e) => setAccount({ ...account, account_type_id: e.value })}
                        placeholder="Seleccione tipo"
                        className={classNames({ 'p-invalid': submitted && !account.account_type_id })}
                    />
                    {submitted && !account.account_type_id && <small className="p-error">El tipo de cuenta es requerido.</small>}
                </div>

                <div className="field">
                    <label htmlFor="account_number" className="font-bold">
                        Número de Cuenta <span className="text-red-500">*</span>
                    </label>
                    <InputText id="account_number" value={account.account_number} onChange={onAccountNumberChange} placeholder="Ej: 1234567890" className={classNames({ 'p-invalid': submitted && !account.account_number })} />
                    {submitted && !account.account_number && <small className="p-error">El número de cuenta es requerido.</small>}
                    <small className="text-500">Solo números y guiones (8-20 caracteres)</small>
                </div>

                <div className="field">
                    <label htmlFor="initial_balance" className="font-bold">
                        Saldo Inicial ({getCurrencySymbolForBalance()})
                    </label>
                    <InputNumber
                        id="initial_balance"
                        value={account.initial_balance}
                        onValueChange={onInitialBalanceChange}
                        mode="currency"
                        currency={isQuetzal(account.currency_id) ? 'GTQ' : 'USD'}
                        locale="es-GT"
                        min={0}
                        max={isQuetzal(account.currency_id) ? 10000000 : 1000000}
                        placeholder={isQuetzal(account.currency_id) ? 'Q 0.00' : '$ 0.00'}
                        useGrouping={true}
                        disabled={!account.currency_id}
                    />
                    <small className="text-500">{!account.currency_id ? 'Seleccione una moneda primero' : `Valor en ${isQuetzal(account.currency_id) ? 'Quetzales (GTQ)' : 'Dólares (USD)'}, no negativo, máximo 2 decimales`}</small>
                </div>

                {/* Nuevo campo para fecha de creación */}
                <div className="field">
                    <label htmlFor="created_at" className="font-bold">
                        Fecha de Creación <span className="text-red-500">*</span>
                    </label>
                    <Calendar
                        id="created_at"
                        value={account.created_at ? new Date(account.created_at) : null}
                        onChange={(e) => {
                            // Guardar como ISO string cuando cambie
                            const selectedDate = e.value;
                            if (selectedDate) {
                                setAccount({ ...account, created_at: selectedDate.toISOString() });
                            } else {
                                setAccount({ ...account, created_at: null });
                            }
                        }}
                        dateFormat="dd/mm/yy"
                        showIcon
                        showButtonBar
                        placeholder="Seleccione fecha de creación"
                        className={classNames({ 'p-invalid': submitted && !account.created_at })}
                        maxDate={new Date()} // No permitir fechas futuras
                    />
                    {submitted && !account.created_at && <small className="p-error">La fecha de creación es requerida.</small>}
                    <small className="text-500">Fecha en que se creó la cuenta bancaria (no puede ser futura)</small>
                </div>
            </Dialog>

            <Dialog
                visible={deleteDialog}
                header="Confirmar Desactivación"
                modal
                onHide={() => setDeleteDialog(false)}
                footer={
                    <>
                        <Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} />
                        <Button label="Sí, Desactivar" icon="pi pi-check" severity="danger" onClick={confirmDelete} />
                    </>
                }
            >
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-3xl text-orange-500 mb-3" />
                    <p>
                        ¿Está seguro que desea desactivar la cuenta <b>{account.account_alias}</b>?
                    </p>
                    <small className="text-500">La cuenta debe tener saldo cero ({getCurrencySymbol(account.currency_id)}0.00) para ser desactivada.</small>
                </div>
            </Dialog>
        </div>
    );
};

export default BankAccountsPage;
