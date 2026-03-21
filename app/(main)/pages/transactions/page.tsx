'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';

import { TransactionService } from '../../../../src/service/transaction.service';

const Transactions = () => {
    const emptyTransaction: any = {
        account_id: null,
        transaction_type: 'INCOME', // Por defecto según tu DB
        category_id: null,
        transaction_date: new Date(),
        amount: 0,
        currency_id: 'USD',
        concept: '',
        beneficiary: ''
    };

    const [transactions, setTransactions] = useState([]);
    const [transaction, setTransaction] = useState(emptyTransaction);
    const [transactionDialog, setTransactionDialog] = useState(false);
    const [cancelDialog, setCancelDialog] = useState(false);
    
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadTransactions();
    }, []);

    const loadTransactions = async () => {
        const data = await TransactionService.getAll();
        setTransactions(data);
    };

    const openNew = () => {
        setTransaction(emptyTransaction);
        setTransactionDialog(true);
    };

    const saveTransaction = async () => {
        if (!transaction.concept || !transaction.amount || !transaction.account_id) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Faltan campos obligatorios', life: 3000 });
            return;
        }

        try {
            if (transaction.transaction_id) {
                await TransactionService.update(transaction.transaction_id, transaction);
            } else {
                // Importante: created_by es obligatorio en tu modelo
                await TransactionService.create({ ...transaction, created_by: 1 }); 
            }

            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Transacción guardada', life: 3000 });
            setTransactionDialog(false);
            loadTransactions();
        } catch (error) {
            console.error(error);
        }
    };

    const confirmCancel = (rowData: any) => {
        setTransaction(rowData);
        setCancelDialog(true);
    };

 const cancelTransaction = async () => {
    // Aquí podrías pasar un texto fijo o un estado de un InputText
    const motivo = "Cancelado por el usuario"; 
    await TransactionService.cancel(transaction.transaction_id, motivo);
    
    setCancelDialog(false);
    loadTransactions();
};

    // --- Plantillas UI ---
    const leftToolbarTemplate = () => (
        <Button label="Nueva Transacción" icon="pi pi-plus" severity="success" onClick={openNew} />
    );

    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => { setTransaction(rowData); setTransactionDialog(true); }} />
            {!rowData.cancelled && (
                <Button icon="pi pi-ban" rounded severity="danger" onClick={() => confirmCancel(rowData)} />
            )}
        </>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            <Toolbar className="mb-4" left={leftToolbarTemplate} />

            <DataTable value={transactions} paginator rows={10} responsiveLayout="scroll">
                <Column field="transaction_id" header="ID" sortable />
                <Column field="transaction_date" header="Fecha" sortable />
                <Column field="concept" header="Concepto" />
                <Column field="amount" header="Monto" body={(row) => `${row.currency_id} ${row.amount}`} sortable />
                <Column header="Estado" body={(row) => row.cancelled ? "🔴 Cancelada" : "🟢 Activa"} />
                <Column body={actionBodyTemplate} header="Acciones" />
            </DataTable>

            {/* DIALOGO DE CREACIÓN/EDICIÓN */}
            <Dialog visible={transactionDialog} style={{ width: '500px' }} header="Detalle de Transacción" modal onHide={() => setTransactionDialog(false)}
                footer={<><Button label="Cancelar" text onClick={() => setTransactionDialog(false)} /><Button label="Guardar" text onClick={saveTransaction} /></>}>
                
                <div className="grid">
                    <div className="field col-12">
                        <label>Cuenta (ID)</label>
                        <InputNumber value={transaction.account_id} onValueChange={(e) => setTransaction({...transaction, account_id: e.value})} className="w-full" />
                    </div>
                    <div className="field col-12">
                        <label>Concepto</label>
                        <InputText value={transaction.concept} onChange={(e) => setTransaction({...transaction, concept: e.target.value})} className="w-full" />
                    </div>
                    <div className="field col-6">
                        <label>Monto</label>
                        <InputNumber value={transaction.amount} onValueChange={(e) => setTransaction({...transaction, amount: e.value})} mode="decimal" minFractionDigits={2} className="w-full" />
                    </div>
                    <div className="field col-6">
                        <label>Fecha</label>
                        <Calendar value={transaction.transaction_date ? new Date(transaction.transaction_date) : null} onChange={(e) => setTransaction({...transaction, transaction_date: e.value})} dateFormat="yy-mm-dd" className="w-full" />
                    </div>
                </div>
            </Dialog>

            {/* DIALOGO DE CANCELACIÓN */}
            <Dialog visible={cancelDialog} header="Confirmar Cancelación" modal onHide={() => setCancelDialog(false)}
                footer={<><Button label="No" text onClick={() => setCancelDialog(false)} /><Button label="Sí, Anular" text onClick={cancelTransaction} /></>}>
                <p>¿Seguro que desea anular la transacción <b>#{transaction.transaction_id}</b>?</p>
            </Dialog>
        </div>
    );
};

export default Transactions;