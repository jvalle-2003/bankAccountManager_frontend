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
    
    // Flags de permisos (Simulados - Modificables según tu AuthContext)
    const canCreate = true;
    const canEdit = true;
    const canDelete = true;
    const canExport = true;
    
    const toast = useRef<Toast>(null);

    // ✅ CORRECCIÓN: loadRecords envuelto correctamente para evitar bucle infinito
    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const data = await balanceHistoryService.getAll();
            setRecords(data || []);
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

    // ==========================================
    // EXPORTACIONES OPTIMIZADAS
    // ==========================================
    const exportToExcel = () => {
        if (!records.length) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay registros para exportar' });
            return;
        }

        const data = records.map(row => ({
            'ID': row.history_id,
            'Cuenta ID': row.account_id,
            'Fecha': new Date(row.balance_date).toLocaleDateString(),
            'Saldo': `Q${row.closing_balance.toFixed(2)}`
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
   // ✅ Líneas corregidas (con una sola X)
XLSX.utils.book_append_sheet(wb, ws, 'Historial de Saldos');
XLSX.writeFile(wb, `historial_saldos_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const exportToPDF = () => {
        if (!records.length) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay registros para exportar a PDF' });
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        doc.setFontSize(16);
        doc.text('Reporte de Historial de Saldos', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString()} | Total: ${records.length} registros`, 14, 28);
        
        const tableData = records.map(row => [
            row.history_id,
            row.account_id,
            new Date(row.balance_date).toLocaleDateString(),
            `Q${row.closing_balance.toFixed(2)}`
        ]);
        
        autoTable(doc, {
            head: [['ID', 'Cuenta ID', 'Fecha', 'Saldo']],
            body: tableData,
            startY: 35,
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 10 }
        });
        
        doc.save(`historial_saldos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const exportToCSV = () => {
        if (!records.length) {
            toast.current?.show({ severity: 'warn', summary: 'Sin datos', detail: 'No hay registros para exportar a CSV' });
            return;
        }

        const headers = ['ID', 'Cuenta ID', 'Fecha', 'Saldo'];
        const rows = records.map(row => [
            row.history_id,
            row.account_id,
            new Date(row.balance_date).toLocaleDateString(),
            `Q${row.closing_balance.toFixed(2)}`
        ]);

        const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n'); // \uFEFF arregla tildes/eñes en Excel
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `historial_saldos_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ==========================================
    // MANEJO DE DIÁLOGOS Y CRUD
    // ==========================================
    const openNew = () => {
        if (!canCreate) return;
        setSelectedRecord({ account_id: undefined, balance_date: '', closing_balance: undefined });
        setIsEditing(false);
        setDialogVisible(true);
    };

    const openEdit = (record: BalanceHistory) => {
        if (!canEdit) return;
        setSelectedRecord({ ...record });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (record: BalanceHistory) => {
        if (!canDelete) return;
        setSelectedRecord(record);
        setDeleteDialogVisible(true);
    };

    const saveRecord = async () => {
        // Validación ligera de campos obligatorios localmente antes de enviar
        if (!selectedRecord.account_id || !selectedRecord.balance_date || selectedRecord.closing_balance === undefined) {
            toast.current?.show({ severity: 'error', summary: 'Atención', detail: 'Por favor complete todos los campos requeridos.' });
            return;
        }

        try {
            if (isEditing && selectedRecord.history_id) {
                await balanceHistoryService.update(selectedRecord.history_id, selectedRecord);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Registro actualizado correctamente' });
            } else {
                await balanceHistoryService.create(selectedRecord as Omit<BalanceHistory, 'history_id'>);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Registro creado correctamente' });
            }
            setDialogVisible(false);
            loadRecords();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Ocurrió un problema al guardar' });
        }
    };

    const deleteRecord = async () => {
        try {
            if (selectedRecord.history_id) {
                await balanceHistoryService.delete(selectedRecord.history_id);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Registro eliminado correctamente' });
                setDeleteDialogVisible(false);
                loadRecords();
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el registro' });
        }
    };

    // ==========================================
    // TEMPLATES DE LA TABLA
    // ==========================================
    const dateBodyTemplate = (rowData: BalanceHistory) => {
        return rowData.balance_date ? new Date(rowData.balance_date).toLocaleDateString() : '';
    };

    const amountBodyTemplate = (rowData: BalanceHistory) => {
        return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(rowData.closing_balance);
    };

    const actionBodyTemplate = (rowData: BalanceHistory) => (
        <div className="flex gap-2">
            {canEdit && <Button icon="pi pi-pencil" rounded text severity="info" onClick={() => openEdit(rowData)} tooltip="Editar" />}
            {canDelete && <Button icon="pi pi-trash" rounded text severity="danger" onClick={() => openDelete(rowData)} tooltip="Eliminar" />}
        </div>
    );

    // Encabezado de la Tabla Dinámico y Elegante
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
            <span className="text-xl font-bold text-900">Historial de Saldos</span>
            <div className="flex flex-wrap gap-2 align-items-center">
                {canExport && (
                    <>
                        <Button icon="pi pi-file-excel" severity="info" onClick={exportToExcel} tooltip="Exportar a Excel" />
                        <Button icon="pi pi-file-pdf" severity="danger" onClick={exportToPDF} tooltip="Exportar a PDF" />
                        <Button icon="pi pi-file" severity="secondary" onClick={exportToCSV} tooltip="Exportar a CSV" />
                    </>
                )}
                <span className="p-input-icon-left w-full md:w-auto">
                    <i className="pi pi-search" />
                    <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." className="w-full md:w-auto" />
                </span>
            </div>
        </div>
    );



    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialogVisible(false)} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteRecord} raised />
        </div>
    );

    // Helper seguro para el casteo de strings de fechas a objetos Date requeridos por PrimeReact
    const getSafeDateValue = (dateStr: any): Date | null => {
        if (!dateStr) return null;
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    };

    return (
        <div className="grid p-fluid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card shadow-2 p-4 surface-card borderRadius-12">
                    <DataTable
                        value={records}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No se encontraron registros de historial"
                        sortField="balance_date"
                        sortOrder={-1}
                        responsiveLayout="scroll"
                        className="p-datatable-sm"
                    >
                        <Column field="history_id" header="ID" sortable style={{ width: '10%' }} />
                        <Column field="account_id" header="Cuenta ID" sortable style={{ width: '25%' }} />
                        <Column field="balance_date" header="Fecha" sortable style={{ width: '25%' }} body={dateBodyTemplate} />
                        <Column field="closing_balance" header="Saldo" sortable style={{ width: '25%' }} body={amountBodyTemplate} />
                        <Column body={actionBodyTemplate} header="Acciones" exportable={false} style={{ width: '15%', minWidth: '8rem' }} />
                    </DataTable>
                </div>
            </div>

            {/* Formulario Dialog */}
            <Dialog
                visible={dialogVisible}
                style={{ width: '450px' }}
                header={isEditing ? "Modificar Registro de Saldo" : "Registrar Nuevo Saldo"}
                modal
                onHide={() => setDialogVisible(false)}
                breakpoints={{ '960px': '75vw', '641px': '90vw' }}
            >
                <div className="field mb-3">
                    <label htmlFor="account_id" className="font-bold block mb-2">ID de Cuenta *</label>
                    <InputNumber
                        id="account_id"
                        value={selectedRecord.account_id}
                        onValueChange={(e) => setSelectedRecord({ ...selectedRecord, account_id: e.value ?? undefined })}
                        useGrouping={false}
                        placeholder="Ingrese el número de cuenta"
                    />
                </div>
                <div className="field mb-3">
                    <label htmlFor="balance_date" className="font-bold block mb-2">Fecha de Cierre *</label>
                    <Calendar
                        id="balance_date"
                        value={getSafeDateValue(selectedRecord.balance_date)}
                        onChange={(e) => {
                            const dateObj = e.value as Date;
                            setSelectedRecord({ 
                                ...selectedRecord, 
                                balance_date: dateObj ? dateObj.toISOString().split('T')[0] : '' 
                            });
                        }}
                        dateFormat="yy-mm-dd"
                        showIcon
                        maxDate={new Date()} // Evita registros en el futuro
                        placeholder="Seleccione la fecha"
                    />
                </div>
                <div className="field mb-3">
                    <label htmlFor="closing_balance" className="font-bold block mb-2">Saldo de Cierre *</label>
                    <InputNumber
                        id="closing_balance"
                        value={selectedRecord.closing_balance}
                        onValueChange={(e) => setSelectedRecord({ ...selectedRecord, closing_balance: e.value ?? undefined })}
                        mode="currency"
                        currency="GTQ"
                        locale="es-GT"
                        placeholder="Q0.00"
                    />
                </div>
            </Dialog>

            {/* Confirmación de Borrado */}
            <Dialog
                visible={deleteDialogVisible}
                style={{ width: '400px' }}
                header="Confirmación Requerida"
                modal
                footer={deleteDialogFooter}
                onHide={() => setDeleteDialogVisible(false)}
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-red-500" style={{ fontSize: '2.5rem' }} />
                    <span>¿Está seguro que desea eliminar este registro? Esta acción no se puede deshacer.</span>
                </div>
            </Dialog>
        </div>
    );
};

export default BalanceHistoryPage;