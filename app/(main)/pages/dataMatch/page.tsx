'use client';
import React, { useState, useRef, useEffect } from 'react';
import { FileUpload } from 'primereact/fileupload';
import { FileUploadHandlerEvent } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import axios from 'axios';

// 🔥 TIPOS
interface Transaction {
    date: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    status: string;
}

interface Account {
    account_id: number;
    account_number: string;
    account_alias: string;
}

const DataMatch = () => {

    const [pdfTransactions, setPdfTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [loading, setLoading] = useState(false);

    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);

    // 🔥 CARGAR CUENTAS
    useEffect(() => {
        axios.get('http://localhost:3001/api/bank-accounts')
            .then(res => setAccounts(res.data))
            .catch(err => console.error(err));
    }, []);

    // 🔥 OCR + ENVIO CUENTA
    const onUploadOCR = async (event: FileUploadHandlerEvent) => {

        if (!selectedAccount) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Seleccione cuenta'
            });
            return;
        }

        setLoading(true);

        try {
            const file = event.files[0];

            const formData = new FormData();
            formData.append('estado_cuenta', file);
            formData.append('accountId', String(selectedAccount.account_id));

            const res = await axios.post(
                'http://localhost:3001/api/ocr/reconciliar-ocr',
                formData
            );

            setPdfTransactions(res.data.transactions);

            toast.current?.show({
                severity: 'success',
                summary: 'OK',
                detail: `${res.data.transactions.length} registros`
            });

        } catch (error) {
            console.error(error);

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al procesar archivo'
            });
        }

        fileUploadRef.current?.clear();
        setLoading(false);
    };

    const downloadExcel = async () => {

    if (!selectedAccount || pdfTransactions.length === 0) return;

    try {
        const response = await axios.post(
            'http://localhost:3001/api/statements/download-excel',
            {
                transactions: pdfTransactions,
                accountId: selectedAccount.account_id
            },
            { responseType: 'blob' }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');

        link.href = url;
        link.setAttribute('download', 'conciliacion.xlsx');

        document.body.appendChild(link);
        link.click();
        link.remove();

    } catch (error) {
        console.error(error);
    }
};

    return (
        <div className="card">
            <Toast ref={toast} />

            {/* 🔥 SELECTOR CUENTA */}
            <Dropdown
                value={selectedAccount}
                options={accounts}
                onChange={(e) => setSelectedAccount(e.value)}
                optionLabel="account_number"
                placeholder="Selecciona cuenta"
                className="mb-3"
            />

            <FileUpload
                ref={fileUploadRef}
                mode="basic"
                auto
                customUpload
                uploadHandler={onUploadOCR}
            />

            <Button 
            label="Descargar Excel"
            icon="pi pi-file-excel"
            className="p-button-success"
            onClick={downloadExcel}
            />

            <DataTable value={pdfTransactions} loading={loading}>
                <Column field="date" header="Fecha" />
                <Column field="description" header="Descripción" />

                <Column
                    header="Débito"
                    body={(r: Transaction) =>
                        r.debit > 0 ? `Q ${r.debit}` : '-'
                    }
                />

                <Column
                    header="Crédito"
                    body={(r: Transaction) =>
                        r.credit > 0 ? `Q ${r.credit}` : '-'
                    }
                />

                <Column field="balance" header="Saldo" />

                <Column
                    header="Estado"
                    body={(r: Transaction) => (
                        <Tag
                            value={r.status}
                            severity={r.status === 'CONCILIADO' ? 'success' : 'warning'}
                        />
                    )}
                />
            </DataTable>
        </div>
    );
};

export default DataMatch;