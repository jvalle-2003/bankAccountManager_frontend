'use client';

import React, { useState, useEffect, useRef } from 'react';

import { FileUpload } from 'primereact/fileupload';
import { FileUploadHandlerEvent } from 'primereact/fileupload';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BankAccountService } from '@/src/service/BankAccountService';
import { TransactionService } from '@/src/service/transaction.service';

import axios from 'axios';

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
    const [reconciling, setReconciling] = useState(false);

    // Resumen de la conciliación
    const [summary, setSummary] = useState<{
        total: number;
        conciliados: number;
        pendientes: number;
        noEncontrados: number;
        vencidos: number;
    } | null>(null);

    const toast = useRef<Toast>(null);
    const fileUploadRef = useRef<FileUpload>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            const data = await BankAccountService.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error(error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las cuentas'
            });
        }
    };

    const onUploadOCR = async (event: FileUploadHandlerEvent) => {
        if (!selectedAccount) {
            toast.current?.show({
                severity: 'error',
                summary: 'Cuenta requerida',
                detail: 'Debes seleccionar una cuenta bancaria antes de procesar'
            });
            return;
        }

        setLoading(true);
        setSummary(null);

        try {
            const file = event.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('accountId', String(selectedAccount.account_id));

            // 1. Extraer transacciones del PDF via OCR
            const response = await axios.post(
                `${API_URL}/reconciliations/analyze`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            const data = response.data;

            // Validar que el estado de cuenta corresponde a la cuenta seleccionada
            const detectedAccount = data.bankAccountDetected;
            if (detectedAccount && detectedAccount !== selectedAccount.account_number) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Cuenta incorrecta',
                    detail: `El archivo pertenece a la cuenta ${detectedAccount}`
                });
                setPdfTransactions([]);
                return;
            }

            const rawTransactions = (data.transactions || []).map((t: any) => ({
                ...t,
                status: 'PENDIENTE' as const
            }));

            if (rawTransactions.length === 0) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Sin transacciones',
                    detail: 'No se encontraron transacciones en el archivo'
                });
                setPdfTransactions([]);
                return;
            }

            // 2. Hacer la conciliación automática contra la BD
            setReconciling(true);
            const reconciledTransactions = await reconcileWithDatabase(
                rawTransactions,
                selectedAccount.account_id
            );

            setPdfTransactions(reconciledTransactions);

            // 3. Calcular resumen
            const s = {
                total: reconciledTransactions.length,
                conciliados: reconciledTransactions.filter(t => t.status === 'CONCILIADO').length,
                pendientes: reconciledTransactions.filter(t => t.status === 'PENDIENTE').length,
                noEncontrados: reconciledTransactions.filter(t => t.status === 'NO_ENCONTRADO').length,
                vencidos: reconciledTransactions.filter(t => t.status === 'VENCIDO').length
            };
            setSummary(s);

            toast.current?.show({
                severity: 'success',
                summary: 'Conciliación completada',
                detail: `${s.conciliados} conciliadas de ${s.total} transacciones`
            });

        } catch (error: any) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail:
                    error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    'Error procesando archivo'
            });
        } finally {
            setLoading(false);
            setReconciling(false);
            fileUploadRef.current?.clear();
        }
    };

    /**
     * Compara las transacciones del PDF con las de la BD.
     * Usa el endpoint /transactions/reconcile-batch si está disponible,
     * o hace la comparación localmente con los datos de la BD.
     */
    const reconcileWithDatabase = async (
        pdfTxs: Transaction[],
        accountId: number
    ): Promise<Transaction[]> => {
        try {
            // Intentar con el endpoint dedicado de conciliación en lote
            const response = await axios.post(`${API_URL}/transactions/reconcile-batch`, {
                transactions: pdfTxs.map(tx => ({
                    reference: tx.reference,
                    date: tx.date,
                    amount: tx.debit > 0 ? tx.debit : tx.credit,
                    type: tx.type
                })),
                accountId
            });

            const results: { reference: string; status: string }[] = response.data.results || [];

            // Mapear los resultados al array de transacciones del PDF
            return pdfTxs.map(tx => {
                const match = results.find(r => r.reference === tx.reference);
                return {
                    ...tx,
                    status: (match?.status as Transaction['status']) || 'NO_ENCONTRADO'
                };
            });

        } catch (endpointError: any) {
            // Si el endpoint no existe aún (404/500), hacer matching local
            if (
                endpointError?.response?.status === 404 ||
                endpointError?.response?.status === 500
            ) {
                console.warn(
                    'Endpoint /transactions/reconcile-batch no disponible. Usando matching local.'
                );
                return reconcileLocally(pdfTxs, accountId);
            }
            throw endpointError;
        }
    };

    /**
     * Fallback: obtiene todas las transacciones de la BD y hace el match en el cliente.
     * Solo concilia transacciones con menos de 3 meses de antigüedad.
     */
    const reconcileLocally = async (
        pdfTxs: Transaction[],
        accountId: number
    ): Promise<Transaction[]> => {
        const allDbTransactions: any[] = await TransactionService.getAll();

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        // Filtrar solo las transacciones de la cuenta seleccionada
        const accountTransactions = allDbTransactions.filter(
            (t) => String(t.account_id) === String(accountId)
        );

        const updatedPdfTxs: Transaction[] = [];

        for (const pdfTx of pdfTxs) {
            const pdfAmount = pdfTx.debit > 0 ? pdfTx.debit : pdfTx.credit;

            // Buscar en BD por referencia y monto (sin importar mayúsculas/minúsculas)
            const matchInDb = accountTransactions.find((dbTx) => {
                const refMatch =
                    dbTx.reference_number &&
                    pdfTx.reference &&
                    String(dbTx.reference_number).trim().toLowerCase() ===
                        String(pdfTx.reference).trim().toLowerCase();

                const amountMatch =
                    Math.abs(Number(dbTx.amount) - pdfAmount) < 0.01;

                return refMatch && amountMatch;
            });

            if (!matchInDb) {
                // No existe en la BD en absoluto
                updatedPdfTxs.push({ ...pdfTx, status: 'NO_ENCONTRADO' });
                continue;
            }

            const txDate = matchInDb.transaction_date
                ? new Date(matchInDb.transaction_date)
                : null;

            // Verificar antigüedad: si tiene más de 3 meses → VENCIDO
            if (txDate && txDate < threeMonthsAgo) {
                updatedPdfTxs.push({ ...pdfTx, status: 'VENCIDO' });
                continue;
            }

            // Verificar si ya estaba conciliada
            if (matchInDb.reconciled) {
                updatedPdfTxs.push({ ...pdfTx, status: 'CONCILIADO' });
                continue;
            }

            // ✅ Actualizar en BD como conciliada
            try {
                await TransactionService.update(String(matchInDb.transaction_id), {
                    reconciled: true,
                    reconciliation_date: new Date().toISOString().split('T')[0]
                });
                updatedPdfTxs.push({ ...pdfTx, status: 'CONCILIADO' });
            } catch (updateErr) {
                console.error(
                    `Error actualizando transacción ${matchInDb.transaction_id}:`,
                    updateErr
                );
                // Si falla el update, dejar como pendiente
                updatedPdfTxs.push({ ...pdfTx, status: 'PENDIENTE' });
            }
        }

        return updatedPdfTxs;
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

    const formatMoney = (value: number) =>
        new Intl.NumberFormat('es-GT', {
            style: 'currency',
            currency: 'GTQ'
        }).format(value || 0);

    const statusSeverity = (status: Transaction['status']) => {
        switch (status) {
            case 'CONCILIADO':   return 'success';
            case 'VENCIDO':      return 'danger';
            case 'NO_ENCONTRADO': return 'info';
            default:             return 'warning';
        }
    };

    return (
        <div className="card">
            <Toast ref={toast} />

            {/* ── Controles superiores ── */}
            <div className="flex flex-column gap-3">
                <Dropdown
                    value={selectedAccount}
                    options={accounts}
                    onChange={(e) => {
                        setSelectedAccount(e.value);
                        setPdfTransactions([]);
                        setSummary(null);
                    }}
                    optionLabel="account_number"
                    placeholder="Selecciona cuenta bancaria"
                    className="w-full md:w-20rem"
                />

                <FileUpload
                    ref={fileUploadRef}
                    mode="basic"
                    auto
                    customUpload
                    chooseLabel="Seleccionar estado de cuenta"
                    uploadLabel="Procesar"
                    cancelLabel="Cancelar"
                    accept=".pdf,.png,.jpg,.jpeg"
                    maxFileSize={10000000}
                    uploadHandler={onUploadOCR}
                    disabled={!selectedAccount || loading}
                />

                <Button
                    label="Descargar Excel"
                    icon="pi pi-file-excel"
                    className="p-button-success w-15rem"
                    onClick={downloadExcel}
                    disabled={pdfTransactions.length === 0}
                />
            </div>

            {/* ── Spinner de carga ── */}
            {(loading || reconciling) && (
                <div className="flex flex-column align-items-center gap-2 mt-4">
                    <ProgressSpinner />
                    <span className="text-500 text-sm">
                        {reconciling
                            ? 'Conciliando transacciones con la base de datos...'
                            : 'Procesando archivo con OCR...'}
                    </span>
                </div>
            )}

            {/* ── Tarjetas de resumen ── */}
            {summary && (
                <div className="grid mt-4">
                    {[
                        { label: 'Total',          value: summary.total,          color: '#6c757d', icon: 'pi-list' },
                        { label: 'Conciliados',    value: summary.conciliados,    color: '#28a745', icon: 'pi-check-circle' },
                        { label: 'Pendientes',     value: summary.pendientes,     color: '#ffc107', icon: 'pi-clock' },
                        { label: 'No encontrados', value: summary.noEncontrados,  color: '#17a2b8', icon: 'pi-search' },
                        { label: 'Vencidos',       value: summary.vencidos,       color: '#dc3545', icon: 'pi-times-circle' }
                    ].map((card) => (
                        <div key={card.label} className="col-12 md:col-2">
                            <div
                                className="flex flex-column align-items-center p-3 border-round shadow-1"
                                style={{ borderTop: `4px solid ${card.color}` }}
                            >
                                <i
                                    className={`pi ${card.icon} text-2xl mb-2`}
                                    style={{ color: card.color }}
                                />
                                <span className="text-3xl font-bold" style={{ color: card.color }}>
                                    {card.value}
                                </span>
                                <span className="text-500 text-sm text-center">{card.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Tabla de resultados ── */}
            <div className="mt-4">
                <DataTable
                    value={pdfTransactions}
                    loading={loading}
                    paginator
                    rows={10}
                    stripedRows
                    emptyMessage="No hay transacciones. Sube un estado de cuenta para iniciar la conciliación."
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
                        body={(r: Transaction) => formatMoney(r.balance)}
                    />

                    <Column
                        header="Tipo"
                        body={(r: Transaction) => (
                            <Tag
                                value={r.type}
                                severity={r.type === 'CREDITO' ? 'success' : 'danger'}
                            />
                        )}
                    />

                    <Column
                        header="Estado"
                        body={(r: Transaction) => (
                            <Tag value={r.status} severity={statusSeverity(r.status)} />
                        )}
                    />
                </DataTable>
            </div>
        </div>
    );
};

export default DataMatch;