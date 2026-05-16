'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { TransactionService } from '@/src/service/transaction.service';
import { BankAccountService } from '@/src/service/BankAccountService';

import { usePermission } from '@/src/hooks/usePermission';

import { Reconciliation } from '@/types';

const ReconciliationsPage = () => {
    // STATES
    const [reconciliations] = useState<Reconciliation[]>([]);
    const [filteredReconciliations] = useState<Reconciliation[]>([]);

    const [transactions, setTransactions] = useState<any[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

    const [transactionLoading, setTransactionLoading] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);

    const [selectedReconciliation, setSelectedReconciliation] =
        useState<Partial<Reconciliation>>({});

    const [transactionAccountFilter, setTransactionAccountFilter] = useState('');
    const [transactionStatusFilter, setTransactionStatusFilter] = useState('');

    // FECHAS
    const [transactionDateFrom, setTransactionDateFrom] = useState<Date | null>(null);
    const [transactionDateTo, setTransactionDateTo] = useState<Date | null>(null);

    const toast = useRef<Toast>(null);

    const { hasPermission, loading: permissionLoading } = usePermission();
    const canView = hasPermission('VER_CONCILIACIONES');

    // EFFECTS
    useEffect(() => {
        if (canView) {
            loadTransactions();
            loadAccounts();
        }
    }, [canView]);

    useEffect(() => {
        applyTransactionFilters();
    }, [
        transactions,
        transactionAccountFilter,
        transactionStatusFilter,
        transactionDateFrom,
        transactionDateTo
    ]);

    // LOAD DATA
    const loadTransactions = async () => {
        setTransactionLoading(true);

        try {
            const data = await TransactionService.getAll();

            const formatted = Array.isArray(data)
                ? data.map((item: any) => {
                      let status = 'PENDING';

                      if (item.reconciled) status = 'RECONCILED';
                      if (item.cancelled) status = 'CANCELLED';

                      let debit = 0;
                      let credit = 0;

                      if (
                          item.category_id === 4 ||
                          item.transaction_type === 'Transferencias de Fondos'
                      ) {
                          debit = Number(item.amount || 0);
                      } else {
                          credit = Number(item.amount || 0);
                      }

                      return {
                          ...item,
                          date: item.transaction_date,
                          reference: item.reference_number,
                          description: item.concept || item.description || '',
                          debit,
                          credit,
                          status,
                          account_id: item.account_id
                      };
                  })
                : [];

            setTransactions(formatted);
            setFilteredTransactions(formatted);
        } catch (error) {
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las transacciones'
            });

            setTransactions([]);
            setFilteredTransactions([]);
        } finally {
            setTransactionLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const data = await BankAccountService.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error(error);
        }
    };

    // FILTROS
    const applyTransactionFilters = () => {
        let filtered = [...transactions];

        if (transactionAccountFilter) {
            filtered = filtered.filter(
                (item) =>
                    String(item.account_id) === String(transactionAccountFilter)
            );
        }

        if (transactionStatusFilter) {
            filtered = filtered.filter(
                (item) => item.status === transactionStatusFilter
            );
        }

        if (transactionDateFrom) {
            filtered = filtered.filter((item) => {
                if (!item.date) return false;
                return new Date(item.date) >= transactionDateFrom;
            });
        }

        if (transactionDateTo) {
            filtered = filtered.filter((item) => {
                if (!item.date) return false;

                const itemDate = new Date(item.date);
                const end = new Date(transactionDateTo);
                end.setHours(23, 59, 59, 999);

                return itemDate <= end;
            });
        }

        setFilteredTransactions(filtered);
    };

    // PDF EXPORT
    const exportPDF = () => {
        const doc = new jsPDF();

        const tableColumn = [
            'Fecha',
            'Referencia',
            'Descripción',
            'Débito',
            'Crédito',
            'Estado'
        ];

        const tableRows: any[] = [];

        filteredTransactions.forEach((tx) => {
            tableRows.push([
                tx.date ? new Date(tx.date).toLocaleDateString() : '',
                tx.reference || '',
                tx.description || '',
                `Q${Number(tx.debit || 0).toFixed(2)}`,
                `Q${Number(tx.credit || 0).toFixed(2)}`,
                tx.status
            ]);
        });

        doc.text('Reporte de Transacciones', 14, 15);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20
        });

        doc.save('reporte-transacciones.pdf');
    };

    // HELPERS
    const amountTemplate = (value: number) => `Q${Number(value || 0).toFixed(2)}`;

    const statusBodyTemplate = (rowData: any) => {
        let severity = 'warning';
        let label = 'Pendiente';

        if (rowData.status === 'RECONCILED') {
            severity = 'success';
            label = 'Conciliado';
        }

        if (rowData.status === 'CANCELLED') {
            severity = 'danger';
            label = 'Cancelado';
        }

        return <span className={`customer-badge status-${severity}`}>{label}</span>;
    };

    // FILTER PANEL
    const transactionFiltersPanel = (
        <div className="grid p-fluid mb-4" style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
            <div className="col-12 md:col-3">
                <label className="font-bold">Cuenta</label>
                <Dropdown
                    value={transactionAccountFilter}
                    options={[
                        { label: 'Todas', value: '' },
                        ...accounts.map((a) => ({
                            label: `${a.account_number} - ${a.account_name || ''}`,
                            value: a.account_id
                        }))
                    ]}
                    onChange={(e) => setTransactionAccountFilter(e.value)}
                    className="w-full"
                />
            </div>

            <div className="col-12 md:col-3">
                <label className="font-bold">Estado</label>
                <Dropdown
                    value={transactionStatusFilter}
                    options={[
                        { label: 'Todos', value: '' },
                        { label: 'Pendiente', value: 'PENDING' },
                        { label: 'Conciliado', value: 'RECONCILED' },
                        { label: 'Cancelado', value: 'CANCELLED' }
                    ]}
                    onChange={(e) => setTransactionStatusFilter(e.value)}
                    className="w-full"
                />
            </div>

            <div className="col-12 md:col-3">
                <label className="font-bold">Desde</label>
                <Calendar
                    value={transactionDateFrom}
                    onChange={(e) => setTransactionDateFrom(e.value as Date)}
                    showIcon
                    className="w-full"
                />
            </div>

            <div className="col-12 md:col-3">
                <label className="font-bold">Hasta</label>
                <Calendar
                    value={transactionDateTo}
                    onChange={(e) => setTransactionDateTo(e.value as Date)}
                    showIcon
                    className="w-full"
                />
            </div>
        </div>
    );

    // ACCESS
    if (!canView && !permissionLoading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card text-center">
                        <i className="pi pi-lock" style={{ fontSize: '3rem' }} />
                        <h3>Acceso Denegado</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">

                    {/* HEADER + EXPORT */}
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h2>Estado de Conciliaciones Bancarias</h2>

                        <button
                            className="p-button p-button-success p-button-sm"
                            onClick={exportPDF}
                        >
                            Exportar PDF
                        </button>
                    </div>

                    {transactionFiltersPanel}

                    <DataTable
                        value={filteredTransactions}
                        loading={transactionLoading}
                        paginator
                        rows={10}
                        emptyMessage="No se encontraron transacciones"
                    >
                        <Column field="date" header="Fecha"
                            body={(r) => r.date ? new Date(r.date).toLocaleDateString() : ''}
                        />
                        <Column field="reference" header="Referencia" />
                        <Column field="description" header="Descripción" />
                        <Column field="debit" header="Débito" body={(r) => amountTemplate(r.debit)} />
                        <Column field="credit" header="Crédito" body={(r) => amountTemplate(r.credit)} />
                        <Column field="status" header="Estado" body={statusBodyTemplate} />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default ReconciliationsPage;