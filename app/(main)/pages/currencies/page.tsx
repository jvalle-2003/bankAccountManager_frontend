'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';

import { CurrencyService } from '../../../../src/service/currency.service';

const Currency = () => {

    const emptyCurrency = {
        id_currency: "",
        name: "",
        symbol: "",
        state: true
    };

    const [currencies, setCurrencies] = useState<any[]>([]);
    const [currency, setCurrency] = useState<any>(emptyCurrency);
    const [currencyDialog, setCurrencyDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);

    const toast = useRef<Toast>(null);

    // ===============================
    // LOAD DATA
    // ===============================
    useEffect(() => {
        loadCurrencies();
    }, []);

    const loadCurrencies = async () => {
        const data = await CurrencyService.getAll();
        setCurrencies(data);
    };

    // ===============================
    // CREATE / EDIT
    // ===============================
    const openNew = () => {
        setCurrency(emptyCurrency);
        setCurrencyDialog(true);
    };

    const editCurrency = (rowData: any) => {
        setCurrency({ ...rowData });
        setCurrencyDialog(true);
    };

    const hideDialog = () => setCurrencyDialog(false);

    const saveCurrency = async () => {

        if (!currency.id_currency || !currency.name) {
            toast.current?.show({
                severity: "warn",
                summary: "Campos requeridos",
                detail: "Complete la información",
                life: 3000
            });
            return;
        }

        const exists = currencies.find(
            c => c.id_currency === currency.id_currency
        );

        if (exists) {
            await CurrencyService.update(currency.id_currency, currency);
        } else {
            await CurrencyService.create(currency);
        }

        toast.current?.show({
            severity: "success",
            summary: "Éxito",
            detail: exists ? "Moneda actualizada" : "Moneda creada",
            life: 3000
        });

        setCurrencyDialog(false);
        loadCurrencies();
    };

    // ===============================
    // DELETE
    // ===============================
    const confirmDelete = (rowData: any) => {
        setCurrency(rowData);
        setDeleteDialog(true);
    };

    const deleteCurrency = async () => {

        await CurrencyService.delete(currency.id_currency);

        toast.current?.show({
            severity: "success",
            summary: "Eliminado",
            detail: "Moneda eliminada",
            life: 3000
        });

        setDeleteDialog(false);
        loadCurrencies();
    };

    // ===============================
    // TABLE ACTIONS
    // ===============================
    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button icon="pi pi-pencil"
                rounded severity="success"
                className="mr-2"
                onClick={() => editCurrency(rowData)}
            />

            <Button icon="pi pi-trash"
                rounded severity="danger"
                onClick={() => confirmDelete(rowData)}
            />
        </>
    );

    const leftToolbarTemplate = () => (
        <Button
            label="Nueva Moneda"
            icon="pi pi-plus"
            severity="success"
            onClick={openNew}
        />
    );

    // ===============================
    // RENDER
    // ===============================
    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">

                    <Toast ref={toast} />

                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable
                        value={currencies}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        emptyMessage="No hay monedas registradas"
                    >
                        <Column field="id_currency" header="Código" sortable />
                        <Column field="name" header="Nombre" sortable />
                        <Column field="symbol" header="Símbolo" />
                        <Column
                            header="Activa"
                            body={(row) => row.state ? "✅" : "❌"}
                        />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>

                    {/* CREATE / EDIT */}
                    <Dialog
                        visible={currencyDialog}
                        style={{ width: '450px' }}
                        header="Moneda"
                        modal
                        onHide={hideDialog}
                        footer={
                            <>
                                <Button label="Cancelar" text onClick={hideDialog} />
                                <Button label="Guardar" text onClick={saveCurrency} />
                            </>
                        }
                    >
                        <div className="field">
                            <label>Código</label>
                            <InputText
                                value={currency.id_currency}
                                onChange={(e) =>
                                    setCurrency({ ...currency, id_currency: e.target.value })
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Nombre</label>
                            <InputText
                                value={currency.name}
                                onChange={(e) =>
                                    setCurrency({ ...currency, name: e.target.value })
                                }
                            />
                        </div>

                        <div className="field">
                            <label>Símbolo</label>
                            <InputText
                                value={currency.symbol}
                                onChange={(e) =>
                                    setCurrency({ ...currency, symbol: e.target.value })
                                }
                            />
                        </div>
                    </Dialog>

                    {/* DELETE */}
                    <Dialog
                        visible={deleteDialog}
                        style={{ width: '400px' }}
                        header="Confirmar"
                        modal
                        onHide={() => setDeleteDialog(false)}
                        footer={
                            <>
                                <Button label="No" text onClick={() => setDeleteDialog(false)} />
                                <Button label="Sí" text onClick={deleteCurrency} />
                            </>
                        }
                    >
                        <p>
                            ¿Desea eliminar la moneda <b>{currency.name}</b>?
                        </p>
                    </Dialog>

                </div>
            </div>
        </div>
    );
};

export default Currency;