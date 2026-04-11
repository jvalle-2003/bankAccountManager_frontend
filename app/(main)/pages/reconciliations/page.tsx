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
import { usePermission } from '@/src/hooks/usePermission';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReconciliationsPage = () => {
    const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedReconciliation, setSelectedReconciliation] = useState<Partial<Reconciliation>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    const { hasPermission, loading: permissionLoading } = usePermission();
    
    const canCreate = hasPermission('CREAR_CONCILIACION');
    const canEdit = hasPermission('EDITAR_CONCILIACION');
    const canDelete = hasPermission('ELIMINAR_CONCILIACION');
    const canView = hasPermission('VER_CONCILIACIONES');
    const canExport = hasPermission('EXPORTAR_REPORTES');  // 👈 NUEVO
    
    const statusOptions = [
        { label: 'En Proceso', value: 'IN_PROCESS' },
        { label: 'Conciliado', value: 'RECONCILED' },
        { label: 'Diferencias', value: 'DIFFERENCES' }
    ];

    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (canView) {
            loadReconciliations();
        }
    }, [canView]);

    const loadReconciliations = async () => {
        setLoading(true);
        try {
            const data = await reconciliationsService.getAll();
            setReconciliations(data);
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

    const exportToExcel = () => {
        if (!reconciliations || reconciliations.length === 0) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Sin datos', 
                detail: 'No hay conciliaciones para exportar' 
            });
            return;
        }

        const data = reconciliations.map(row => ({
            'ID': row.reconciliation_id,
            'Cuenta ID': row.account_id,
            'Año': row.year,
            'Mes': row.month,
            'Mes Nombre': new Date(0, row.month - 1).toLocaleString('es', { month: 'long' }),
            'Fecha Inicio': row.start_date,
            'Fecha Fin': row.end_date,
            'Fecha Conciliación': row.reconciliation_date,
            'Estado': row.status === 'IN_PROCESS' ? 'En Proceso' : row.status === 'RECONCILED' ? 'Conciliado' : 'Diferencias',
            'Saldo Inicial Banco': row.bank_initial_balance || 0,
            'Saldo Final Banco': row.bank_final_balance || 0,
            'Saldo Inicial Libros': row.book_initial_balance || 0,
            'Saldo Final Libros': row.book_final_balance || 0,
            'Diferencia': (row.bank_final_balance || 0) - (row.book_final_balance || 0),
            'Observaciones': row.observations || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        ws['!cols'] = [
            { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 8 }, { wch: 15 },
            { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 18 },
            { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 30 }
        ];
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Conciliaciones');
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `conciliaciones_${fecha}.xlsx`);
        
        toast.current?.show({ 
            severity: 'success', 
            summary: 'Exportado', 
            detail: 'Archivo Excel generado correctamente' 
        });
    };

    const exportToPDF = () => {
        if (!reconciliations || reconciliations.length === 0) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Sin datos', 
                detail: 'No hay conciliaciones para exportar a PDF' 
            });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        
        doc.setFontSize(18);
        doc.text('Reporte de Conciliaciones Bancarias', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total de conciliaciones: ${reconciliations.length}`, 14, 37);
        
        const tableData = reconciliations.map(row => [
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
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 20 },
                2: { cellWidth: 15 },
                3: { cellWidth: 15 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 30 },
                7: { cellWidth: 30 },
                8: { cellWidth: 30 },
                9: { cellWidth: 30 }
            }
        });
        
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`conciliaciones_${fecha}.pdf`);
        
        toast.current?.show({ 
            severity: 'success', 
            summary: 'Exportado', 
            detail: 'Archivo PDF generado correctamente' 
        });
    };

    const openNew = () => {
        if (!canCreate) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Acceso Denegado', 
                detail: 'No tienes permiso para crear conciliaciones' 
            });
            return;
        }
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
        if (!canEdit) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Acceso Denegado', 
                detail: 'No tienes permiso para editar conciliaciones' 
            });
            return;
        }
        setSelectedReconciliation({ ...reconciliation });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (reconciliation: Reconciliation) => {
        if (!canDelete) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Acceso Denegado', 
                detail: 'No tienes permiso para eliminar conciliaciones' 
            });
            return;
        }
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
            case 'IN_PROCESS':
                severity = 'warning';
                label = 'En Proceso';
                break;
            case 'RECONCILED':
                severity = 'success';
                label = 'Conciliado';
                break;
            case 'DIFFERENCES':
                severity = 'danger';
                label = 'Diferencias';
                break;
        }
        return <span className={`customer-badge status-${severity}`}>{label}</span>;
    };

    const dateBodyTemplate = (rowData: Reconciliation, field: string) => {
        return rowData[field as keyof Reconciliation] 
            ? new Date(rowData[field as keyof Reconciliation] as string).toLocaleDateString() 
            : '';
    };

    const amountBodyTemplate = (rowData: Reconciliation, field: string) => {
        const value = rowData[field as keyof Reconciliation] as number;
        return value ? `Q${value.toFixed(2)}` : 'Q0.00';
    };

    const actionBodyTemplate = (rowData: Reconciliation) => {
        return (
            <div className="flex gap-2">
                {canEdit && (
                    <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(rowData)} tooltip="Editar" />
                )}
                {canDelete && (
                    <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => openDelete(rowData)} tooltip="Eliminar" />
                )}
            </div>
        );
    };

    // ==========================================
    // HEADER CON PERMISOS DE EXPORTACIÓN
    // ==========================================
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Conciliaciones</span>
            <div className="flex gap-2">
                {canCreate && (
                    <Button label="Nuevo" icon="pi pi-plus" severity="success" onClick={openNew} />
                )}
                {canExport && (
                    <>
                        <Button label="Exportar a Excel" icon="pi pi-file-excel" severity="info" onClick={exportToExcel} />
                        <Button label="Exportar a PDF" icon="pi pi-file-pdf" severity="danger" onClick={exportToPDF} />
                    </>
                )}
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
                </span>
            </div>
        </div>
    );

    if (!canView && !permissionLoading) {
        return (
            <div className="grid">
                <div className="col-12">
                    <div className="card text-center">
                        <i className="pi pi-lock" style={{ fontSize: '3rem', color: 'var(--red-500)' }} />
                        <h3>Acceso Denegado</h3>
                        <p>No tienes permiso para ver las conciliaciones.</p>
                    </div>
                </div>
            </div>
        );
    }

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
                        value={reconciliations}
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