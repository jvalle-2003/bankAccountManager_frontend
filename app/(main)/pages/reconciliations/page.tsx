'use client';

import React, { useEffect, useRef, useState } from 'react';

import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import { TransactionService } from '@/src/service/transaction.service';
import { BankAccountService } from '@/src/service/BankAccountService';
import { CategoryService } from '@/src/service/category.service';

import { Reconciliation } from '@/types';

const ReconciliationsPage = () => {
    // STATES
    const [reconciliations] = useState<Reconciliation[]>([]);
    const [filteredReconciliations] = useState<Reconciliation[]>([]);

    const [transactions, setTransactions] = useState<any[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);

    const [transactionLoading, setTransactionLoading] = useState(false);

    const [accounts, setAccounts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Filtros
    const [transactionAccountFilter, setTransactionAccountFilter] = useState('');
    const [transactionStatusFilter, setTransactionStatusFilter] = useState('');
    const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');

    // FECHAS
    const [transactionDateFrom, setTransactionDateFrom] = useState<Date | null>(null);
    const [transactionDateTo, setTransactionDateTo] = useState<Date | null>(null);

    // Dialog de detalles
    const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
    const [detailsDialog, setDetailsDialog] = useState(false);

    const toast = useRef<Toast>(null);

    // EFFECTS
    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        applyTransactionFilters();
    }, [transactions, transactionAccountFilter, transactionStatusFilter, transactionTypeFilter, transactionDateFrom, transactionDateTo, globalSearch]);

    // Validación de fechas
    useEffect(() => {
        if (transactionDateFrom && transactionDateTo && transactionDateFrom > transactionDateTo) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Fechas inválidas',
                detail: 'La fecha "Desde" no puede ser mayor que "Hasta"',
                life: 3000
            });
            setTransactionDateFrom(transactionDateTo);
        }
    }, [transactionDateFrom, transactionDateTo]);

    // LOAD DATA
    const loadInitialData = async () => {
        try {
            await loadCategories();
            await Promise.all([loadTransactions(), loadAccounts()]);
        } catch (error) {
            console.error('Error loading initial data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Error al cargar datos iniciales'
            });
        }
    };

    const loadCategories = async () => {
        try {
            const data = await CategoryService.getAll();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las categorías'
            });
        }
    };

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

                      const category = categories.find((cat) => String(cat.category_id) === String(item.category_id));
                      const movementType = category?.movement_type || '';
                      const amount = Number(item.amount || 0);

                      if (movementType === 'EGRESO') {
                          debit = amount;
                          credit = 0;
                      } else if (movementType === 'INGRESO') {
                          debit = 0;
                          credit = amount;
                      } else {
                          const categoryName = category?.category_name?.toLowerCase() || '';
                          const isEgreso = categoryName.includes('egreso') || categoryName.includes('retiro') || categoryName.includes('pago') || categoryName.includes('compra') || categoryName.includes('rechazo');
                          const isIngreso = categoryName.includes('ingreso') || categoryName.includes('deposito') || categoryName.includes('transferencia credito');

                          if (isEgreso) {
                              debit = amount;
                              credit = 0;
                          } else if (isIngreso) {
                              debit = 0;
                              credit = amount;
                          } else {
                              if (amount < 0) {
                                  debit = Math.abs(amount);
                                  credit = 0;
                              } else {
                                  debit = 0;
                                  credit = amount;
                              }
                          }
                      }

                      return {
                          ...item,
                          date: item.transaction_date,
                          reference: item.reference_number,
                          description: item.concept || item.description || '',
                          debit,
                          credit,
                          status,
                          account_id: item.account_id,
                          transaction_type: item.transaction_type,
                          category: category,
                          movement_type: movementType,
                          category_name: category?.category_name || 'Sin categoría'
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
            filtered = filtered.filter((item) => String(item.account_id) === String(transactionAccountFilter));
        }

        if (transactionStatusFilter) {
            filtered = filtered.filter((item) => item.status === transactionStatusFilter);
        }

        if (transactionTypeFilter) {
            filtered = filtered.filter((item) => item.movement_type === transactionTypeFilter);
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

        if (globalSearch) {
            const searchLower = globalSearch.toLowerCase();
            filtered = filtered.filter((item) => item.reference?.toLowerCase().includes(searchLower) || item.description?.toLowerCase().includes(searchLower) || item.category_name?.toLowerCase().includes(searchLower));
        }

        setFilteredTransactions(filtered);
    };

    // FUNCIONES PARA FECHAS RÁPIDAS
    const setQuickDate = (days: number) => {
        const to = new Date();
        const from = new Date();
        from.setDate(to.getDate() - days);
        setTransactionDateFrom(from);
        setTransactionDateTo(to);
    };

    const clearDates = () => {
        setTransactionDateFrom(null);
        setTransactionDateTo(null);
    };

    // TOTALES
    const getTotals = () => {
        const totalDebit = filteredTransactions.reduce((sum, tx) => sum + tx.debit, 0);
        const totalCredit = filteredTransactions.reduce((sum, tx) => sum + tx.credit, 0);
        const netBalance = totalCredit - totalDebit;

        return { totalDebit, totalCredit, netBalance };
    };

    // EXPORTAR PDF
    const exportPDF = () => {
        const doc = new jsPDF();

        const tableColumn = ['Fecha', 'Referencia', 'Descripción', 'Categoría', 'Tipo Movimiento', 'Débito (Q)', 'Crédito (Q)', 'Estado'];

        const tableRows: any[] = [];

        filteredTransactions.forEach((tx) => {
            tableRows.push([
                tx.date ? new Date(tx.date).toLocaleDateString() : '',
                tx.reference || '',
                tx.description || '',
                tx.category_name || 'N/A',
                tx.movement_type === 'INGRESO' ? 'INGRESO (Crédito)' : tx.movement_type === 'EGRESO' ? 'EGRESO (Débito)' : 'N/A',
                tx.debit > 0 ? `Q${tx.debit.toFixed(2)}` : '',
                tx.credit > 0 ? `Q${tx.credit.toFixed(2)}` : '',
                tx.status === 'PENDING' ? 'Pendiente' : tx.status === 'RECONCILED' ? 'Conciliado' : 'Cancelado'
            ]);
        });

        const totals = getTotals();

        doc.text('Reporte de Transacciones', 14, 15);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 22);
        doc.text(`Total Débitos: Q${totals.totalDebit.toFixed(2)}`, 14, 29);
        doc.text(`Total Créditos: Q${totals.totalCredit.toFixed(2)}`, 14, 36);
        doc.text(`Balance Neto: Q${totals.netBalance.toFixed(2)}`, 14, 43);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50
        });

        doc.save(`reporte-transacciones-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // EXPORTAR EXCEL
    const exportToExcel = () => {
        const exportData = filteredTransactions.map((tx) => ({
            Fecha: tx.date ? new Date(tx.date).toLocaleDateString() : '',
            Referencia: tx.reference || '',
            Descripción: tx.description || '',
            Categoría: tx.category_name || '',
            'Tipo Movimiento': tx.movement_type === 'EGRESO' ? 'Débito' : tx.movement_type === 'INGRESO' ? 'Crédito' : 'N/A',
            'Débito (Q)': tx.debit || 0,
            'Crédito (Q)': tx.credit || 0,
            Estado: tx.status === 'PENDING' ? 'Pendiente' : tx.status === 'RECONCILED' ? 'Conciliado' : 'Cancelado'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
        XLSX.writeFile(wb, `transacciones-${new Date().toISOString().split('T')[0]}.xlsx`);

        toast.current?.show({
            severity: 'success',
            summary: 'Exportado',
            detail: 'Archivo Excel generado correctamente'
        });
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

    const typeBodyTemplate = (rowData: any) => {
        if (rowData.movement_type === 'EGRESO') {
            return <span className="text-red-600 font-bold">DÉBITO</span>;
        } else if (rowData.movement_type === 'INGRESO') {
            return <span className="text-green-600 font-bold">CRÉDITO</span>;
        }
        return <span className="text-500">-</span>;
    };

    const currencySymbolBody = (rowData: any) => {
        const account = accounts.find((a) => a.account_id === rowData.account_id);
        const symbol = account?.currency?.symbol || 'Q';
        return <span className="font-bold">{symbol}</span>;
    };

    const onRowClick = (event: any) => {
        setSelectedTransaction(event.data);
        setDetailsDialog(true);
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
                            label: `${a.account_number} - ${a.account_alias || a.account_number}`,
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
                <label className="font-bold">Tipo Movimiento</label>
                <Dropdown
                    value={transactionTypeFilter}
                    options={[
                        { label: 'Todos', value: '' },
                        { label: 'Débito (Egresos)', value: 'EGRESO' },
                        { label: 'Crédito (Ingresos)', value: 'INGRESO' }
                    ]}
                    onChange={(e) => setTransactionTypeFilter(e.value)}
                    className="w-full"
                />
            </div>

            <div className="col-12 md:col-3">
                <label className="font-bold">Buscar</label>
                <InputText value={globalSearch} onChange={(e) => setGlobalSearch(e.target.value)} placeholder="Referencia, descripción..." className="w-full" />
            </div>

            <div className="col-12 md:col-3">
                <label className="font-bold">Desde</label>
                <Calendar value={transactionDateFrom} onChange={(e) => setTransactionDateFrom(e.value as Date)} showIcon className="w-full" dateFormat="dd/mm/yy" />
            </div>

            <div className="col-12 md:col-3">
                <label className="font-bold">Hasta</label>
                <Calendar value={transactionDateTo} onChange={(e) => setTransactionDateTo(e.value as Date)} showIcon className="w-full" dateFormat="dd/mm/yy" />
            </div>

            <div className="col-12">
                <div className="flex gap-2 mt-2">
                    <Button
                        label="Hoy"
                        size="small"
                        text
                        onClick={() => {
                            const today = new Date();
                            setTransactionDateFrom(today);
                            setTransactionDateTo(today);
                        }}
                    />
                    <Button label="Últimos 7 días" size="small" text onClick={() => setQuickDate(7)} />
                    <Button label="Últimos 30 días" size="small" text onClick={() => setQuickDate(30)} />
                    <Button
                        label="Este mes"
                        size="small"
                        text
                        onClick={() => {
                            const now = new Date();
                            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                            setTransactionDateFrom(firstDay);
                            setTransactionDateTo(now);
                        }}
                    />
                    <Button label="Limpiar fechas" size="small" severity="secondary" text onClick={clearDates} />
                </div>
            </div>
        </div>
    );

    // RENDER PRINCIPAL
    return (
        <div className="grid">
            <Toast ref={toast} />

            <div className="col-12">
                <div className="card">
                    <div className="flex justify-content-between align-items-center mb-4">
                        <h2>Estado de Conciliaciones Bancarias</h2>
                        <div>
                            <Button label="Refrescar" icon="pi pi-refresh" className="p-button-secondary p-button-sm" onClick={() => loadInitialData()} loading={transactionLoading} />
                            <Button label="Exportar PDF" icon="pi pi-file-pdf" className="p-button-success p-button-sm" onClick={exportPDF} style={{ marginLeft: '10px' }} />
                            <Button label="Exportar Excel" icon="pi pi-file-excel" className="p-button-success p-button-sm" onClick={exportToExcel} style={{ marginLeft: '10px' }} />
                        </div>
                    </div>

                    {/* Panel de Totales */}
                    {filteredTransactions.length > 0 && (
                        <div className="grid mb-4" style={{ background: '#e9ecef', padding: '1rem', borderRadius: '8px' }}>
                            <div className="col-12 md:col-4">
                                <div className="text-center">
                                    <small className="text-500">Total Débitos</small>
                                    <div className="text-red-600 font-bold text-xl">Q{getTotals().totalDebit.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="text-center">
                                    <small className="text-500">Total Créditos</small>
                                    <div className="text-green-600 font-bold text-xl">Q{getTotals().totalCredit.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="col-12 md:col-4">
                                <div className="text-center">
                                    <small className="text-500">Balance Neto</small>
                                    <div className={getTotals().netBalance >= 0 ? 'text-green-600 font-bold text-xl' : 'text-red-600 font-bold text-xl'}>Q{getTotals().netBalance.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {transactionFiltersPanel}

                    <DataTable value={filteredTransactions} loading={transactionLoading} paginator rows={10} rowsPerPageOptions={[10, 25, 50, 100]} emptyMessage="No se encontraron transacciones" onRowClick={onRowClick} rowClassName="cursor-pointer">
                        <Column field="date" header="Fecha" body={(r) => (r.date ? new Date(r.date).toLocaleDateString() : '')} sortable />
                        <Column field="reference" header="Referencia" sortable />
                        <Column field="description" header="Descripción" sortable />
                        <Column field="category_name" header="Categoría" sortable />
                        <Column header="Tipo Movimiento" body={typeBodyTemplate} sortable sortField="movement_type" />
                        <Column field="debit" header="Débito (Q)" body={(r) => (r.debit > 0 ? amountTemplate(r.debit) : '')} sortable />
                        <Column field="credit" header="Crédito (Q)" body={(r) => (r.credit > 0 ? amountTemplate(r.credit) : '')} sortable />
                        <Column header="Moneda" body={currencySymbolBody} style={{ width: '80px' }} />
                        <Column field="status" header="Estado" body={statusBodyTemplate} sortable />
                    </DataTable>
                </div>
            </div>

            {/* Dialog de Detalles */}
            <Dialog visible={detailsDialog} header="Detalles de Transacción" onHide={() => setDetailsDialog(false)} style={{ width: '500px' }}>
                {selectedTransaction && (
                    <div className="p-fluid">
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Fecha</label>
                            <div>{selectedTransaction.date ? new Date(selectedTransaction.date).toLocaleString() : 'N/A'}</div>
                        </div>
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Referencia</label>
                            <div>{selectedTransaction.reference || 'N/A'}</div>
                        </div>
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Descripción</label>
                            <div>{selectedTransaction.description || 'N/A'}</div>
                        </div>
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Categoría</label>
                            <div>{selectedTransaction.category_name || 'N/A'}</div>
                        </div>
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Tipo de Movimiento</label>
                            <div className={selectedTransaction.movement_type === 'EGRESO' ? 'text-red-600' : 'text-green-600'}>
                                {selectedTransaction.movement_type === 'EGRESO' ? 'DÉBITO (Egreso)' : selectedTransaction.movement_type === 'INGRESO' ? 'CRÉDITO (Ingreso)' : 'N/A'}
                            </div>
                        </div>
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Monto</label>
                            <div className={selectedTransaction.debit > 0 ? 'text-red-600 font-bold text-xl' : 'text-green-600 font-bold text-xl'}>
                                {selectedTransaction.debit > 0 ? `-Q${selectedTransaction.debit.toFixed(2)}` : selectedTransaction.credit > 0 ? `+Q${selectedTransaction.credit.toFixed(2)}` : 'Q0.00'}
                            </div>
                        </div>
                        <div className="field mb-3">
                            <label className="font-bold block mb-1">Estado</label>
                            <div>{statusBodyTemplate(selectedTransaction)}</div>
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default ReconciliationsPage;
