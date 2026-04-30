'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { balanceHistoryService } from '@/src/service/balanceHistory.service';
import { BalanceHistory } from '@/types';
import { usePermission } from '@/src/hooks/usePermission';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BalanceHistoryPage = () => {
    const [records, setRecords] = useState<BalanceHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<Partial<BalanceHistory>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    const { hasPermission, loading: permissionLoading } = usePermission();
    
    const canCreate = hasPermission('CREAR_HISTORIAL');
    const canEdit = hasPermission('EDITAR_HISTORIAL');
    const canDelete = hasPermission('ELIMINAR_HISTORIAL');
    const canView = hasPermission('VER_HISTORIAL');
    const canExport = hasPermission('EXPORTAR_HISTORIAL');
    const canExportCSV = hasPermission('EXPORTAR_CSV');
    
    const toast = useRef<Toast>(null);

    useEffect(() => {
        if (canView) {
            loadRecords();
        }
    }, [canView]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const data = await balanceHistoryService.getAll();
            setRecords(data);
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudieron cargar los registros' 
            });
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!records || records.length === 0) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Sin datos', 
                detail: 'No hay registros para exportar' 
            });
            return;
        }

        const data = records.map(row => ({
            'ID': row.history_id,
            'Cuenta ID': row.account_id,
            'Fecha': row.balance_date,
            'Saldo': `Q${row.closing_balance.toFixed(2)}`
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Historial de Saldos');
        const fecha = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `historial_saldos_${fecha}.xlsx`);
        
        toast.current?.show({ 
            severity: 'success', 
            summary: 'Exportado', 
            detail: 'Archivo Excel generado correctamente' 
        });
    };

    const exportToPDF = () => {
        if (!records || records.length === 0) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Sin datos', 
                detail: 'No hay registros para exportar a PDF' 
            });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        
        doc.setFontSize(18);
        doc.text('Reporte de Historial de Saldos', 14, 22);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total de registros: ${records.length}`, 14, 37);
        
        const tableData = records.map(row => [
            row.history_id,
            row.account_id,
            row.balance_date,
            `Q${row.closing_balance.toFixed(2)}`
        ]);
        
        autoTable(doc, {
            head: [['ID', 'Cuenta ID', 'Fecha', 'Saldo']],
            body: tableData,
            startY: 45,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 240, 240] },
            styles: { fontSize: 10, cellPadding: 2 }
        });
        
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`historial_saldos_${fecha}.pdf`);
        
        toast.current?.show({ 
            severity: 'success', 
            summary: 'Exportado', 
            detail: 'Archivo PDF generado correctamente' 
        });
    };

    // ==========================================
    // EXPORTAR A CSV
    // ==========================================
    const exportToCSV = () => {
        if (!records || records.length === 0) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Sin datos', 
                detail: 'No hay registros para exportar a CSV' 
            });
            return;
        }

        const headers = ['ID', 'Cuenta ID', 'Fecha', 'Saldo'];
        
        const rows = records.map(row => [
            row.history_id,
            row.account_id,
            row.balance_date,
            `Q${row.closing_balance.toFixed(2)}`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `historial_saldos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.current?.show({ 
            severity: 'success', 
            summary: 'Exportado', 
            detail: 'Archivo CSV generado correctamente' 
        });
    };

    const openNew = () => {
        if (!canCreate) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Acceso Denegado', 
                detail: 'No tienes permiso para crear registros' 
            });
            return;
        }
        setSelectedRecord({
            account_id: 0,
            balance_date: '',
            closing_balance: 0
        });
        setIsEditing(false);
        setDialogVisible(true);
    };

    const openEdit = (record: BalanceHistory) => {
        if (!canEdit) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Acceso Denegado', 
                detail: 'No tienes permiso para editar registros' 
            });
            return;
        }
        setSelectedRecord({ ...record });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (record: BalanceHistory) => {
        if (!canDelete) {
            toast.current?.show({ 
                severity: 'warn', 
                summary: 'Acceso Denegado', 
                detail: 'No tienes permiso para eliminar registros' 
            });
            return;
        }
        setSelectedRecord(record);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => setDialogVisible(false);
    const hideDeleteDialog = () => setDeleteDialogVisible(false);

    const saveRecord = async () => {
        try {
            if (isEditing && selectedRecord.history_id) {
                await balanceHistoryService.update(selectedRecord.history_id, selectedRecord);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Registro actualizado' });
            } else {
                await balanceHistoryService.create(selectedRecord as Omit<BalanceHistory, 'history_id'>);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Registro creado' });
            }
            setDialogVisible(false);
            loadRecords();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el registro' });
        }
    };

    const deleteRecord = async () => {
        try {
            if (selectedRecord.history_id) {
                await balanceHistoryService.delete(selectedRecord.history_id);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado' });
                setDeleteDialogVisible(false);
                loadRecords();
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro' });
        }
    };

    const dateBodyTemplate = (rowData: BalanceHistory) => {
        return new Date(rowData.balance_date).toLocaleDateString();
    };

    const amountBodyTemplate = (rowData: BalanceHistory) => {
        return `Q${rowData.closing_balance.toFixed(2)}`;
    };

    const actionBodyTemplate = (rowData: BalanceHistory) => {
        return (
            <div className="flex gap-2">
                {canEdit && (
                    <Button 
                        icon="pi pi-pencil" 
                        rounded 
                        text 
                        severity="info" 
                        onClick={() => openEdit(rowData)} 
                        tooltip="Editar"
                    />
                )}
                {canDelete && (
                    <Button 
                        icon="pi pi-trash" 
                        rounded 
                        text 
                        severity="danger" 
                        onClick={() => openDelete(rowData)} 
                        tooltip="Eliminar"
                    />
                )}
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Historial de Saldos</span>
            <div className="flex gap-2">
                {canCreate && (
                    <Button 
                        label="Nuevo" 
                        icon="pi pi-plus" 
                        severity="success" 
                        onClick={openNew} 
                    />
                )}
                {canExport && (
                    <>
                        <Button 
                            label="Exportar a Excel" 
                            icon="pi pi-file-excel" 
                            severity="info" 
                            onClick={exportToExcel} 
                        />
                        <Button 
                            label="Exportar a PDF" 
                            icon="pi pi-file-pdf" 
                            severity="danger" 
                            onClick={exportToPDF} 
                        />
                    </>
                )}
                {canExportCSV && (
                    <Button 
                        label="Exportar a CSV" 
                        icon="pi pi-file" 
                        severity="secondary" 
                        onClick={exportToCSV} 
                    />
                )}
                <span className="p-input-icon-left">
                    <i className="pi pi-search" />
                    <InputText 
                        value={globalFilter} 
                        onChange={(e) => setGlobalFilter(e.target.value)} 
                        placeholder="Buscar..." 
                    />
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
                        <p>No tienes permiso para ver el historial de saldos.</p>
                    </div>
                </div>
            </div>
        );
    }

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={saveRecord} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteRecord} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={records}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No hay registros de historial"
                        sortField="balance_date"
                        sortOrder={-1}
                    >
                        <Column field="history_id" header="ID" sortable style={{ minWidth: '6rem' }} />
                        <Column field="account_id" header="Cuenta ID" sortable style={{ minWidth: '8rem' }} />
                        <Column field="balance_date" header="Fecha" sortable style={{ minWidth: '10rem' }} body={dateBodyTemplate} />
                        <Column field="closing_balance" header="Saldo" sortable style={{ minWidth: '12rem' }} body={amountBodyTemplate} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog
                visible={dialogVisible}
                style={{ width: '450px' }}
                header={isEditing ? "Editar Registro" : "Nuevo Registro"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="account_id">ID de Cuenta *</label>
                    <InputNumber
                        id="account_id"
                        value={selectedRecord.account_id}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, account_id: e.value || 0 })}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="balance_date">Fecha *</label>
                    <Calendar
                        id="balance_date"
                        value={selectedRecord.balance_date ? new Date(selectedRecord.balance_date) : null}
                        onChange={(e) => setSelectedRecord({ 
                            ...selectedRecord, 
                            balance_date: e.value ? (e.value as Date).toISOString().split('T')[0] : '' 
                        })}
                        dateFormat="yy-mm-dd"
                        showIcon
                    />
                </div>
                <div className="field">
                    <label htmlFor="closing_balance">Saldo *</label>
                    <InputNumber
                        id="closing_balance"
                        value={selectedRecord.closing_balance}
                        onChange={(e) => setSelectedRecord({ ...selectedRecord, closing_balance: e.value || 0 })}
                        mode="currency"
                        currency="GTQ"
                        locale="es-GT"
                    />
                </div>
            </Dialog>

            <Dialog
                visible={deleteDialogVisible}
                style={{ width: '450px' }}
                header="Confirmar Eliminación"
                modal
                footer={deleteDialogFooter}
                onHide={hideDeleteDialog}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>
                        ¿Estás seguro que deseas eliminar este registro?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default BalanceHistoryPage;