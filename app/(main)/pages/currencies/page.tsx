'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { classNames } from 'primereact/utils';

import { CurrencyService } from '../../../../src/service/currency.service';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CurrencyForm {
    id_currency?: number;
    name: string;
    symbol: string;
    state: boolean;
}

interface FormErrors {
    name?: string;
    symbol?: string;
}

// ─── Símbolos de moneda válidos ───────────────────────────────────────────────

const SYMBOL_OPTIONS = [
    { label: '$ — Dólar (USD)', value: '$' },
    { label: 'Q — Quetzal (GTQ)', value: 'Q' },
    { label: '€ — Euro (EUR)', value: '€' },
    { label: '£ — Libra (GBP)', value: '£' },
    { label: '¥ — Yen / Yuan (JPY/CNY)', value: '¥' },
    { label: '₩ — Won (KRW)', value: '₩' },
    { label: 'R$ — Real (BRL)', value: 'R$' },
    { label: '₹ — Rupia (INR)', value: '₹' },
    { label: 'Fr — Franco Suizo (CHF)', value: 'Fr' },
    { label: 'MX$ — Peso Mexicano', value: 'MX$' },
    { label: 'C$ — Peso Colombiano', value: 'C$' },
    { label: 'S/ — Sol (PEN)', value: 'S/' },
    { label: '₱ — Peso Filipino', value: '₱' },
    { label: '₺ — Lira (TRY)', value: '₺' },
    { label: '₴ — Hryvnia (UAH)', value: '₴' },
    { label: '₿ — Bitcoin (BTC)', value: '₿' }
];

const VALID_SYMBOLS = new Set(SYMBOL_OPTIONS.map((o) => o.value));

// ─── Constante vacía ──────────────────────────────────────────────────────────

const emptyCurrency: CurrencyForm = { name: '', symbol: '', state: true };

// ─── Componente ───────────────────────────────────────────────────────────────

const Currency = () => {
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [currency, setCurrency] = useState<CurrencyForm>(emptyCurrency);
    const [currencyDialog, setCurrencyDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadCurrencies();
    }, []);

    // ── Carga ──────────────────────────────────────────────────────────────────

    const loadCurrencies = async () => {
        setLoading(true);
        try {
            const data = await CurrencyService.getAll();
            setCurrencies(data);
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las monedas.',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // ── Validación ─────────────────────────────────────────────────────────────

    const validate = (): FormErrors => {
        const errors: FormErrors = {};

        if (!currency.name.trim()) {
            errors.name = 'El nombre es obligatorio.';
        } else if (currency.name.trim().length < 2) {
            errors.name = 'El nombre debe tener al menos 2 caracteres.';
        } else if (currency.name.trim().length > 60) {
            errors.name = 'El nombre no puede superar los 60 caracteres.';
        }

        if (!currency.symbol) {
            errors.symbol = 'Debe seleccionar un símbolo válido.';
        } else if (!VALID_SYMBOLS.has(currency.symbol)) {
            errors.symbol = 'El símbolo ingresado no es válido.';
        }

        return errors;
    };

    const hasErrors = (e: FormErrors) => Object.keys(e).length > 0;

    // ── CRUD ───────────────────────────────────────────────────────────────────

    const openNew = () => {
        setCurrency(emptyCurrency);
        setSubmitted(false);
        setCurrencyDialog(true);
    };

    const editCurrency = (rowData: any) => {
        setCurrency({ ...rowData });
        setSubmitted(false);
        setCurrencyDialog(true);
    };

    const hideDialog = () => {
        setSubmitted(false);
        setCurrencyDialog(false);
    };

    const saveCurrency = async () => {
        setSubmitted(true);
        const errors = validate();
        if (hasErrors(errors)) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Campos inválidos',
                detail: 'Corrija los errores antes de guardar.',
                life: 3000
            });
            return;
        }

        setSaving(true);
        try {
            const isEdit = currencies.some((c) => c.id_currency === currency.id_currency);
            const payload = { ...currency, name: currency.name.trim() };

            if (isEdit) {
                await CurrencyService.update(String(currency.id_currency!), payload);
            } else {
                await CurrencyService.create(payload);
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: isEdit ? 'Moneda actualizada correctamente.' : 'Moneda creada correctamente.',
                life: 3000
            });

            setCurrencyDialog(false);
            setSubmitted(false);
            loadCurrencies();
        } catch (error: any) {
            const msg = error?.response?.data?.message ?? 'No se pudo guardar la moneda.';
            toast.current?.show({ severity: 'error', summary: 'Error', detail: msg, life: 4000 });
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (rowData: any) => {
        setCurrency(rowData);
        setDeleteDialog(true);
    };

    const deleteCurrency = async () => {
        try {
            await CurrencyService.delete(String(currency.id_currency!));
            toast.current?.show({
                severity: 'success',
                summary: 'Eliminado',
                detail: 'Moneda eliminada correctamente.',
                life: 3000
            });
            setDeleteDialog(false);
            loadCurrencies();
        } catch {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar la moneda.',
                life: 3000
            });
        }
    };

    // ── Plantillas de columnas ─────────────────────────────────────────────────

    const symbolBodyTemplate = (rowData: any) => <span className="font-bold text-lg">{rowData.symbol}</span>;

    const stateBodyTemplate = (rowData: any) => <Tag value={rowData.state ? 'Activa' : 'Inactiva'} severity={rowData.state ? 'success' : 'warning'} />;

    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button icon="pi pi-pencil" rounded text severity="success" className="mr-2" tooltip="Editar" tooltipOptions={{ position: 'top' }} onClick={() => editCurrency(rowData)} />
            <Button icon="pi pi-trash" rounded text severity="danger" tooltip="Eliminar" tooltipOptions={{ position: 'top' }} onClick={() => confirmDelete(rowData)} />
        </>
    );

    const leftToolbarTemplate = () => <Button label="Nueva Moneda" icon="pi pi-plus" severity="success" onClick={openNew} />;

    // ── Plantilla de opción del Dropdown ──────────────────────────────────────

    const symbolOptionTemplate = (option: any) => (
        <div className="flex align-items-center gap-2">
            <span className="font-bold" style={{ minWidth: '2rem' }}>
                {option.value}
            </span>
            <span className="text-color-secondary text-sm">{option.label.split('—')[1]?.trim()}</span>
        </div>
    );

    const selectedSymbolTemplate = (option: any, props: any) => {
        if (option) {
            return (
                <div className="flex align-items-center gap-2">
                    <span className="font-bold">{option.value}</span>
                    <span className="text-color-secondary text-sm">{option.label.split('—')[1]?.trim()}</span>
                </div>
            );
        }
        return <span>{props.placeholder}</span>;
    };

    // ── Errores (solo tras submit) ─────────────────────────────────────────────

    const errors = submitted ? validate() : {};

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable value={currencies} paginator rows={10} rowsPerPageOptions={[5, 10, 25]} responsiveLayout="scroll" emptyMessage="No hay monedas registradas." loading={loading} sortMode="multiple">
                        <Column field="id_currency" header="ID" sortable style={{ width: '5rem' }} />
                        <Column field="name" header="Nombre" sortable />
                        <Column field="symbol" header="Símbolo" body={symbolBodyTemplate} />
                        <Column header="Estado" body={stateBodyTemplate} />
                        <Column header="Acciones" body={actionBodyTemplate} />
                    </DataTable>

                    {/* ── Formulario ────────────────────────────────────── */}
                    <Dialog
                        visible={currencyDialog}
                        style={{ width: '460px' }}
                        header={currency.id_currency ? 'Editar Moneda' : 'Nueva Moneda'}
                        modal
                        className="p-fluid"
                        onHide={hideDialog}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" outlined onClick={hideDialog} disabled={saving} />
                                <Button label={saving ? 'Guardando…' : 'Guardar'} icon={saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'} onClick={saveCurrency} disabled={saving} />
                            </>
                        }
                    >
                        {/* Nombre */}
                        <div className="field mb-4">
                            <label htmlFor="currency_name" className="block mb-2 font-semibold">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <InputText
                                id="currency_name"
                                value={currency.name}
                                onChange={(e) => setCurrency({ ...currency, name: e.target.value })}
                                maxLength={60}
                                placeholder="Ej. Dólar Estadounidense"
                                className={classNames('w-full', { 'p-invalid': errors.name })}
                                autoFocus
                            />
                            {errors.name ? <small className="p-error block mt-1">{errors.name}</small> : <small className="text-color-secondary">{currency.name.length}/60 caracteres</small>}
                        </div>

                        {/* Símbolo */}
                        <div className="field">
                            <label htmlFor="currency_symbol" className="block mb-2 font-semibold">
                                Símbolo <span className="text-red-500">*</span>
                            </label>
                            <Dropdown
                                id="currency_symbol"
                                value={currency.symbol}
                                options={SYMBOL_OPTIONS}
                                onChange={(e) => setCurrency({ ...currency, symbol: e.value })}
                                placeholder="Seleccione un símbolo válido"
                                className={classNames('w-full', { 'p-invalid': errors.symbol })}
                                itemTemplate={symbolOptionTemplate}
                                valueTemplate={selectedSymbolTemplate}
                                filter
                                filterPlaceholder="Buscar símbolo..."
                                showClear
                            />
                            {errors.symbol && <small className="p-error block mt-1">{errors.symbol}</small>}
                            {/* Vista previa */}
                            {currency.symbol && (
                                <div className="mt-2 flex align-items-center gap-2">
                                    <span className="text-color-secondary text-sm">Vista previa:</span>
                                    <span className="font-bold text-xl border-1 border-round px-2 py-1 surface-100">{currency.symbol} 1,000.00</span>
                                </div>
                            )}
                        </div>
                    </Dialog>

                    {/* ── Confirmar eliminación ────────────────────────── */}
                    <Dialog
                        visible={deleteDialog}
                        style={{ width: '420px' }}
                        header={
                            <span>
                                <i className="pi pi-exclamation-triangle text-yellow-500 mr-2" />
                                Confirmar Eliminación
                            </span>
                        }
                        modal
                        onHide={() => setDeleteDialog(false)}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" outlined onClick={() => setDeleteDialog(false)} />
                                <Button label="Eliminar" icon="pi pi-trash" severity="danger" onClick={deleteCurrency} />
                            </>
                        }
                    >
                        <div className="flex align-items-center gap-3">
                            <i className="pi pi-info-circle text-3xl text-yellow-500" />
                            <span>
                                ¿Desea eliminar la moneda <b>{currency.name}</b>{' '}
                                {currency.symbol && (
                                    <span>
                                        (<b>{currency.symbol}</b>)
                                    </span>
                                )}
                                ? Esta acción no se puede deshacer.
                            </span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Currency;
