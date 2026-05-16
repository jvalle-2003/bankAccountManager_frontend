'use client';

import React, {
    useState,
    useEffect,
    useRef
} from 'react';

import { FileUpload } from 'primereact/fileupload';
import { FileUploadHandlerEvent } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

import axios from 'axios';

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001/api';

interface Transaction {
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    type: string;
    status: 'CONCILIADO' | 'PENDIENTE' | 'NO_ENCONTRADO' | 'VENCIDO';
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

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const response = await axios.get(`${API_URL}/bank-accounts`);
            setAccounts(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const onUploadOCR = async (event: FileUploadHandlerEvent) => {

        // ❌ VALIDACIÓN 1: cuenta obligatoria
        if (!selectedAccount) {
            toast.current?.show({
                severity: 'error',
                summary: 'Cuenta requerida',
                detail: 'Debes seleccionar una cuenta bancaria antes de procesar'
            });
            return;
        }

        setLoading(true);

        try {
            const file = event.files[0];

            const formData = new FormData();
            formData.append('file', file);
            formData.append('accountId', String(selectedAccount.account_id));

            const response = await axios.post(
                `${API_URL}/reconciliations/analyze`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            const data = response.data;

            // ==============================
            // ✅ VALIDACIÓN REAL (BACKEND)
            // ==============================
            const detectedAccount = data.bankAccountDetected;

            if (
                detectedAccount &&
                detectedAccount !== selectedAccount.account_number
            ) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cuenta incorrecta',
                    detail: `El archivo pertenece a ${detectedAccount}`
                });

                setPdfTransactions([]);
                return; // ❗ STOP REAL
            }

            const transactions = (data.transactions || []).map((t: any) => ({
                ...t,
                status: t.status || 'PENDIENTE'
            }));

            setPdfTransactions(transactions);

            toast.current?.show({
                severity: 'success',
                summary: 'Procesado',
                detail: `${transactions.length} transacciones encontradas`
            });

        } catch (error: any) {

            toast.current?.show({
                severity: 'error',
                summary: 'Error OCR',
                detail:
                    error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    'Error procesando archivo'
            });

        } finally {
            setLoading(false);
            fileUploadRef.current?.clear();
        }
    };

    const downloadExcel = async () => {

        if (!selectedAccount) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Debes seleccionar una cuenta'
            });
            return;
        }

        if (pdfTransactions.length === 0) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Sin datos',
                detail: 'No hay transacciones para exportar'
            });
            return;
        }

        const response = await axios.post(
            `${API_URL}/statements/download-excel`,
            {
                transactions: pdfTransactions,
                accountId: selectedAccount.account_id
            },
            { responseType: 'blob' }
        );

        const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'conciliacion.xlsx');

        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const formatMoney = (value: number) => {
        return new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(value || 0);
    };

    return (
        <div className="card">

            <Toast ref={toast} />

            <div className="flex flex-column gap-3">

                <Dropdown
                    value={selectedAccount}
                    options={accounts}
                    onChange={(e) => setSelectedAccount(e.value)}
                    optionLabel="account_number"
                    placeholder="Selecciona cuenta bancaria"
                    className="w-full md:w-20rem"
                />

                <FileUpload
                    ref={fileUploadRef}
                    mode="basic"
                    auto
                    customUpload
                    chooseLabel="Seleccionar archivo"
                    uploadLabel="Procesar"
                    cancelLabel="Cancelar"
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxFileSize={10000000}
                    uploadHandler={onUploadOCR}
                />

                <Button
                    label="Descargar Excel"
                    icon="pi pi-file-excel"
                    className="p-button-success w-15rem"
                    onClick={downloadExcel}
                    disabled={pdfTransactions.length === 0}
                />
            </div>

            {loading && (
                <div className="flex justify-content-center mt-4">
                    <ProgressSpinner />
                </div>
            )}

            <div className="mt-4">

                <DataTable
                    value={pdfTransactions}
                    loading={loading}
                    paginator
                    rows={10}
                    stripedRows
                    emptyMessage="No hay transacciones"
                >

                    <Column field="date" header="Fecha" />
                    <Column field="reference" header="Referencia" />
                    <Column field="description" header="Descripción" />

                    <Column
                        header="Débito"
                        body={(r: Transaction) =>
                            r.debit > 0 ? formatMoney(r.debit) : '-'
                        }
                    />

                    <Column
                        header="Crédito"
                        body={(r: Transaction) =>
                            r.credit > 0 ? formatMoney(r.credit) : '-'
                        }
                    />

                    <Column
                        header="Saldo"
                        body={(r: Transaction) =>
                            formatMoney(r.balance)
                        }
                    />

                    <Column
                        header="Tipo"
                        body={(r: Transaction) => (
                            <Tag
                                value={r.type}
                                severity={
                                    r.type === 'CREDITO'
                                        ? 'success'
                                        : 'danger'
                                }
                            />
                        )}
                    />

                    <Column
                        header="Estado"
                        body={(r: Transaction) => (
                            <Tag
                                value={r.status}
                                severity={
                                    r.status === 'CONCILIADO'
                                        ? 'success'
                                        : r.status === 'VENCIDO'
                                        ? 'danger'
                                        : r.status === 'NO_ENCONTRADO'
                                        ? 'info'
                                        : 'warning'
                                }
                            />
                        )}
                    />

                </DataTable>

            </div>
        </div>
    );
};

export default DataMatch;