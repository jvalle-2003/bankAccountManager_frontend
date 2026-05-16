'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { reconciliationsService } from '@/src/service/reconciliations.service';
import { Reconciliation } from '@/types';
import { BankAccountService } from '@/src/service/BankAccountService';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReconciliationsPage = () => {
    // Estados
    const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
    const [filteredReconciliations, setFilteredReconciliations] = useState<Reconciliation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedReconciliation, setSelectedReconciliation] = useState<Partial<Reconciliation>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    // Estados para filtros
    const [accounts, setAccounts] = useState<any[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');
    const [filterMonth, setFilterMonth] = useState<string>('');
    const [filterAccount, setFilterAccount] = useState<string>('');
    const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
    const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
    
    // Opciones de años (últimos 5 años + futuro)
    const yearOptions = () => {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 2; i <= currentYear + 2; i++) {
            years.push({ label: i.toString(), value: i.toString() });
        }
        return years;
    };
    
    // Opciones de meses
    const monthOptions = [
        { label: 'Todos', value: '' },
        { label: 'Enero', value: '1' },
        { label: 'Febrero', value: '2' },
        { label: 'Marzo', value: '3' },
        { label: 'Abril', value: '4' },
        { label: 'Mayo', value: '5' },
        { label: 'Junio', value: '6' },
        { label: 'Julio', value: '7' },
        { label: 'Agosto', value: '8' },
        { label: 'Septiembre', value: '9' },
        { label: 'Octubre', value: '10' },
        { label: 'Noviembre', value: '11' },
        { label: 'Diciembre', value: '12' }
    ];
    
    // Opciones de estado
    const statusFilterOptions = [
        { label: 'Todos', value: '' },
        { label: 'En Proceso', value: 'IN_PROCESS' },
        { label: 'Conciliado', value: 'RECONCILED' },
        { label: 'Diferencias', value: 'DIFFERENCES' }
    ];
    
    // Opciones para el dropdown de estado (para el diálogo de edición)
    const statusOptions = [
        { label: 'En Proceso', value: 'IN_PROCESS' },
        { label: 'Conciliado', value: 'RECONCILED' },
        { label: 'Diferencias', value: 'DIFFERENCES' }
    ];

    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadAccounts();
        loadReconciliations();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [reconciliations, filterStatus, filterYear, filterMonth, filterAccount, filterStartDate, filterEndDate]);

    const loadReconciliations = async () => {
        setLoading(true);
        try {
            const data = await reconciliationsService.getAll();
            setReconciliations(data);
            setFilteredReconciliations(data);
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudieron cargar las conciliaciones' 
            });
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const data = await BankAccountService.getAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Error cargando cuentas:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...reconciliations];
        
        if (filterStatus) {
            filtered = filtered.filter(item => item.status === filterStatus);
        }
        if (filterYear) {
            filtered = filtered.filter(item => item.year === parseInt(filterYear));
        }
        if (filterMonth) {
            filtered = filtered.filter(item => item.month === parseInt(filterMonth));
        }
        if (filterAccount) {
            filtered = filtered.filter(item => item.account_id === parseInt(filterAccount));
        }
        if (filterStartDate) {
            const startDateStr = filterStartDate.toISOString().split('T')[0];
            filtered = filtered.filter(item => item.start_date >= startDateStr);
        }
        if (filterEndDate) {
            const endDateStr = filterEndDate.toISOString().split('T')[0];
            filtered = filtered.filter(item => item.end_date <= endDateStr);
        }
        
        setFilteredReconciliations(filtered);
    };

    const clearFilters = () => {
        setFilterStatus('');
        setFilterYear('');
        setFilterMonth('');
        setFilterAccount('');
        setFilterStartDate(null);
        setFilterEndDate(null);
    };

    const exportToExcel = () => {
        if (!filteredReconciliations || filteredReconciliations.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay conciliaciones para exportar' });
            return;
        }

        const data = filteredReconciliations.map(row => ({
            'ID': row.reconciliation_id,
            'Cuenta ID': row.account_id,
            'Año': row.year,
            'Mes': row.month,
            'Mes Nombre': new Date(0, row.month - 1).toLocaleString('es', { month: 'long' }),
            'Fecha Inicio': row.start_date,
            'Fecha Fin': row.end_date,
            'Fecha Conciliación': row.reconciliation_date,
            'Estado': row.status === 'IN_PROCESS' ? 'En Proceso' : row.status === 'RECONCILED' ? 'Conciliado' : 'Diferencias',
            'Saldo Final Banco': row.bank_final_balance || 0,
            'Saldo Final Libros': row.book_final_balance || 0,
            'Diferencia': (row.bank_final_balance || 0) - (row.book_final_balance || 0)
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Conciliaciones');
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `conciliaciones_${fecha}.xlsx`);
        
        toast.current?.show({ severity: 'success', summary: 'Exportado', detail: 'Archivo Excel generado correctamente' });
    };

    const exportToPDF = () => {
        if (!filteredReconciliations || filteredReconciliations.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay conciliaciones para exportar a PDF' });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(18);
        doc.text('Reporte de Conciliaciones Bancarias', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total de conciliaciones: ${filteredReconciliations.length}`, 14, 37);
        
        let filtersText = 'Filtros: ';
        if (filterStatus) filtersText += `Estado: ${statusFilterOptions.find(o => o.value === filterStatus)?.label} `;
        if (filterYear) filtersText += `Año: ${filterYear} `;
        if (filterMonth) filtersText += `Mes: ${monthOptions.find(o => o.value === filterMonth)?.label} `;
        if (filterAccount && accounts.length > 0) {
            const account = accounts.find(a => a.account_id === parseInt(filterAccount));
            filtersText += `Cuenta: ${account?.account_number || filterAccount} `;
        }
        doc.setFontSize(8);
        doc.text(filtersText, 14, 44);
        
        const tableData = filteredReconciliations.map(row => [
            row.reconciliation_id,
            row.account_id,
            row.year,
            row.month,
            row.start_date,
            row.end_date,
            row.status === 'IN_PROCESS' ? 'En Proceso' : row.status === 'RECONCILED' ? 'Conciliado' : 'Diferencias',
            `Q${(row.bank_final_balance || 0).toFixed(2)}`,
            `Q${(row.book_final_balance || 0).toFixed(2)}`,
            `Q${((row.bank_final_balance || 0) - (row.book_final_balance || 0)).toFixed(2)}`
        ]);
        
        autoTable(doc, {
            head: [['ID', 'Cuenta', 'Año', 'Mes', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Saldo Banco', 'Saldo Libros', 'Diferencia']],
            body: tableData,
            startY: 50,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            styles: { fontSize: 8, cellPadding: 2 }
        });
        
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`conciliaciones_${fecha}.pdf`);
        
        toast.current?.show({ severity: 'success', summary: 'Exportado', detail: 'Archivo PDF generado correctamente' });
    };

    const exportToCSV = () => {
        if (!filteredReconciliations || filteredReconciliations.length === 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay conciliaciones para exportar a CSV' });
            return;
        }

        const headers = ['ID', 'Cuenta ID', 'Año', 'Mes', 'Mes Nombre', 'Fecha Inicio', 'Fecha Fin', 'Estado', 'Saldo Final Banco', 'Saldo Final Libros', 'Diferencia'];
        const rows = filteredReconciliations.map(row => [
            row.reconciliation_id,
            row.account_id,
            row.year,
            row.month,
            new Date(0, row.month - 1).toLocaleString('es', { month: 'long' }),
            row.start_date,
            row.end_date,
            row.status === 'IN_PROCESS' ? 'En Proceso' : row.status === 'RECONCILED' ? 'Conciliado' : 'Diferencias',
            row.bank_final_balance || 0,
            row.book_final_balance || 0,
            (row.bank_final_balance || 0) - (row.book_final_balance || 0)
        ]);

        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `conciliaciones_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.current?.show({ severity: 'success', summary: 'Exportado', detail: 'Archivo CSV generado correctamente' });
    };

    const openNew = () => {
        setSelectedReconciliation({
            account_id: 0,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            start_date: '',
            end_date: '',
            status: 'IN_PROCESS',
            bank_initial_balance: 0,
            bank_final_balance: 0,
            book_initial_balance: 0,
            book_final_balance: 0
        });
        setIsEditing(false);
        setDialogVisible(true);
    };

    const openEdit = (reconciliation: Reconciliation) => {
        setSelectedReconciliation({ ...reconciliation });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (reconciliation: Reconciliation) => {
        setSelectedReconciliation(reconciliation);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => setDialogVisible(false);
    const hideDeleteDialog = () => setDeleteDialogVisible(false);

    const saveReconciliation = async () => {
        try {
            if (isEditing && selectedReconciliation.reconciliation_id) {
                await reconciliationsService.update(selectedReconciliation.reconciliation_id, selectedReconciliation);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Conciliación actualizada' });
            } else {
                await reconciliationsService.create(selectedReconciliation as Omit<Reconciliation, 'reconciliation_id'>);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Conciliación creada' });
            }
            setDialogVisible(false);
            loadReconciliations();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la conciliación' });
        }
    };

    const deleteReconciliation = async () => {
        try {
            if (selectedReconciliation.reconciliation_id) {
                await reconciliationsService.delete(selectedReconciliation.reconciliation_id);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Conciliación eliminada' });
                setDeleteDialogVisible(false);
                loadReconciliations();
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la conciliación' });
        }
    };

    const statusBodyTemplate = (rowData: Reconciliation) => {
        let severity = 'info';
        let label = '';
        switch (rowData.status) {
            case 'IN_PROCESS': severity = 'warning'; label = 'En Proceso'; break;
            case 'RECONCILED': severity = 'success'; label = 'Conciliado'; break;
            case 'DIFFERENCES': severity = 'danger'; label = 'Diferencias'; break;
        }
        return <span className={`customer-badge status-${severity}`}>{label}</span>;
    };

    const dateBodyTemplate = (rowData: Reconciliation, field: string) => {
        return rowData[field as keyof Reconciliation] ? new Date(rowData[field as keyof Reconciliation] as string).toLocaleDateString() : '';
    };

    const amountBodyTemplate = (rowData: Reconciliation, field: string) => {
        const value = rowData[field as keyof Reconciliation] as number;
        return value ? `Q${value.toFixed(2)}` : 'Q0.00';
    };

    const actionBodyTemplate = (rowData: Reconciliation) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(rowData)} tooltip="Editar" />
                <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => openDelete(rowData)} tooltip="Eliminar" />
            </div>
        );
    };

    const filtersPanel = (
        <div className="grid p-fluid mb-3" style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
            <div className="col-12 md:col-2">
                <label className="font-bold">Estado</label>
                <Dropdown value={filterStatus} options={statusFilterOptions} onChange={(e) => setFilterStatus(e.value)} placeholder="Todos" className="w-full" />
            </div>
            <div className="col-12 md:col-2">
                <label className="font-bold">Año</label>
                <Dropdown value={filterYear} options={yearOptions()} onChange={(e) => setFilterYear(e.value)} placeholder="Todos" className="w-full" />
            </div>
            <div className="col-12 md:col-2">
                <label className="font-bold">Mes</label>
                <Dropdown value={filterMonth} options={monthOptions} onChange={(e) => setFilterMonth(e.value)} placeholder="Todos" className="w-full" />
            </div>
            <div className="col-12 md:col-3">
                <label className="font-bold">Cuenta</label>
                <Dropdown 
                    value={filterAccount} 
                    options={[{ label: 'Todas las cuentas', value: '' }, ...accounts.map(acc => ({ label: `${acc.account_number} - ${acc.account_alias || 'Sin alias'}`, value: acc.account_id.toString() }))]} 
                    onChange={(e) => setFilterAccount(e.value)} 
                    placeholder="Todas" 
                    className="w-full" 
                />
            </div>
            <div className="col-12 md:col-3">
                <label className="font-bold">Fecha Desde</label>
                <Calendar value={filterStartDate} onChange={(e) => setFilterStartDate(e.value as Date)} dateFormat="yy-mm-dd" showIcon placeholder="dd/mm/yyyy" className="w-full" />
            </div>
            <div className="col-12 md:col-3">
                <label className="font-bold">Fecha Hasta</label>
                <Calendar value={filterEndDate} onChange={(e) => setFilterEndDate(e.value as Date)} dateFormat="yy-mm-dd" showIcon placeholder="dd/mm/yyyy" className="w-full" />
            </div>
            <div className="col-12 md:col-2 flex align-items-end">
                <Button label="Limpiar Filtros" icon="pi pi-filter-slash" severity="secondary" onClick={clearFilters} className="w-full" />
            </div>
        </div>
    );

    const header = (
        <div>
            {filtersPanel}
            <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                <span className="text-xl text-900 font-bold">Conciliaciones</span>
                <div className="flex gap-2">
                    <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} />
                    <Button label="Exportar a Excel" icon="pi pi-file-excel" severity="info" onClick={exportToExcel} />
                    <Button label="Exportar a PDF" icon="pi pi-file-pdf" severity="danger" onClick={exportToPDF} />
                    <Button label="Exportar a CSV" icon="pi pi-file" severity="secondary" onClick={exportToCSV} />
                    <span className="p-input-icon-left">
                        <i className="pi pi-search" />
                        <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
                    </span>
                </div>
            </div>
        </div>
    );

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={saveReconciliation} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteReconciliation} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={filteredReconciliations}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No se encontraron conciliaciones"
                        sortField="reconciliation_id"
                        sortOrder={-1}
                    >
                        <Column field="reconciliation_id" header="ID" sortable style={{ minWidth: '6rem' }} />
                        <Column field="account_id" header="Cuenta ID" sortable style={{ minWidth: '8rem' }} />
                        <Column field="year" header="Año" sortable style={{ minWidth: '6rem' }} />
                        <Column field="month" header="Mes" sortable style={{ minWidth: '6rem' }} body={(rowData) => new Date(0, rowData.month - 1).toLocaleString('es', { month: 'long' })} />
                        <Column field="start_date" header="Fecha Inicio" sortable style={{ minWidth: '10rem' }} body={(rowData) => dateBodyTemplate(rowData, 'start_date')} />
                        <Column field="end_date" header="Fecha Fin" sortable style={{ minWidth: '10rem' }} body={(rowData) => dateBodyTemplate(rowData, 'end_date')} />
                        <Column field="status" header="Estado" sortable style={{ minWidth: '10rem' }} body={statusBodyTemplate} />
                        <Column field="bank_final_balance" header="Saldo Final Banco" sortable style={{ minWidth: '12rem' }} body={(rowData) => amountBodyTemplate(rowData, 'bank_final_balance')} />
                        <Column field="book_final_balance" header="Saldo Final Libros" sortable style={{ minWidth: '12rem' }} body={(rowData) => amountBodyTemplate(rowData, 'book_final_balance')} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog visible={dialogVisible} style={{ width: '600px' }} header={isEditing ? "Editar Conciliación" : "Nueva Conciliación"} modal className="p-fluid" footer={dialogFooter} onHide={hideDialog}>
                <div className="field">
                    <label htmlFor="account_id">ID de Cuenta *</label>
                    <InputNumber id="account_id" value={selectedReconciliation.account_id} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, account_id: e.value || 0 })} required />
                </div>
                <div className="field">
                    <label htmlFor="year">Año *</label>
                    <InputNumber id="year" value={selectedReconciliation.year} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, year: e.value || 2025 })} required min={2000} max={2100} />
                </div>
                <div className="field">
                    <label htmlFor="month">Mes *</label>
                    <InputNumber id="month" value={selectedReconciliation.month} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, month: e.value || 1 })} required min={1} max={12} />
                </div>
                <div className="field">
                    <label htmlFor="start_date">Fecha Inicio *</label>
                    <Calendar id="start_date" value={selectedReconciliation.start_date ? new Date(selectedReconciliation.start_date) : null} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, start_date: e.value ? (e.value as Date).toISOString().split('T')[0] : '' })} dateFormat="yy-mm-dd" showIcon />
                </div>
                <div className="field">
                    <label htmlFor="end_date">Fecha Fin *</label>
                    <Calendar id="end_date" value={selectedReconciliation.end_date ? new Date(selectedReconciliation.end_date) : null} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, end_date: e.value ? (e.value as Date).toISOString().split('T')[0] : '' })} dateFormat="yy-mm-dd" showIcon />
                </div>
                <div className="field">
                    <label htmlFor="bank_initial_balance">Saldo Inicial Banco</label>
                    <InputNumber id="bank_initial_balance" value={selectedReconciliation.bank_initial_balance} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, bank_initial_balance: e.value || 0 })} mode="currency" currency="GTQ" locale="es-GT" />
                </div>
                <div className="field">
                    <label htmlFor="bank_final_balance">Saldo Final Banco</label>
                    <InputNumber id="bank_final_balance" value={selectedReconciliation.bank_final_balance} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, bank_final_balance: e.value || 0 })} mode="currency" currency="GTQ" locale="es-GT" />
                </div>
                <div className="field">
                    <label htmlFor="book_initial_balance">Saldo Inicial Libros</label>
                    <InputNumber id="book_initial_balance" value={selectedReconciliation.book_initial_balance} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, book_initial_balance: e.value || 0 })} mode="currency" currency="GTQ" locale="es-GT" />
                </div>
                <div className="field">
                    <label htmlFor="book_final_balance">Saldo Final Libros</label>
                    <InputNumber id="book_final_balance" value={selectedReconciliation.book_final_balance} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, book_final_balance: e.value || 0 })} mode="currency" currency="GTQ" locale="es-GT" />
                </div>
                <div className="field">
                    <label htmlFor="status">Estado</label>
                    <Dropdown id="status" value={selectedReconciliation.status} options={statusOptions} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, status: e.value })} placeholder="Seleccione un estado" />
                </div>
                <div className="field">
                    <label htmlFor="observations">Observaciones</label>
                    <InputText id="observations" value={selectedReconciliation.observations || ''} onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, observations: e.target.value })} />
                </div>
            </Dialog>

            <Dialog visible={deleteDialogVisible} style={{ width: '450px' }} header="Confirmar Eliminación" modal footer={deleteDialogFooter} onHide={hideDeleteDialog}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>¿Estás seguro que deseas eliminar esta conciliación?</span>
                </div>
            </Dialog>
        </div>
    );
};

export default ReconciliationsPage;