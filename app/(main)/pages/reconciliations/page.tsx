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

const ReconciliationsPage = () => {
    // Estados
    const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedReconciliation, setSelectedReconciliation] = useState<Partial<Reconciliation>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    // Opciones para el dropdown de estado
    const statusOptions = [
        { label: 'En Proceso', value: 'IN_PROCESS' },
        { label: 'Conciliado', value: 'RECONCILED' },
        { label: 'Diferencias', value: 'DIFFERENCES' }
    ];

    // Referencias
    const toast = useRef<Toast>(null);

    // Cargar datos al iniciar
    useEffect(() => {
        loadReconciliations();
    }, []);

    // Función para cargar conciliaciones
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

    // Abrir diálogo para nueva conciliación
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

    // Abrir diálogo para editar
    const openEdit = (reconciliation: Reconciliation) => {
        setSelectedReconciliation({ ...reconciliation });
        setIsEditing(true);
        setDialogVisible(true);
    };

    // Abrir diálogo para eliminar
    const openDelete = (reconciliation: Reconciliation) => {
        setSelectedReconciliation(reconciliation);
        setDeleteDialogVisible(true);
    };

    // Cerrar diálogos
    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    // Guardar conciliación (crear o actualizar)
    const saveReconciliation = async () => {
        try {
            if (isEditing && selectedReconciliation.reconciliation_id) {
                await reconciliationsService.update(selectedReconciliation.reconciliation_id, selectedReconciliation);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Conciliación actualizada' 
                });
            } else {
                await reconciliationsService.create(selectedReconciliation as Omit<Reconciliation, 'reconciliation_id'>);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Conciliación creada' 
                });
            }
            setDialogVisible(false);
            loadReconciliations();
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo guardar la conciliación' 
            });
        }
    };

    // Eliminar conciliación
    const deleteReconciliation = async () => {
        try {
            if (selectedReconciliation.reconciliation_id) {
                await reconciliationsService.delete(selectedReconciliation.reconciliation_id);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Conciliación eliminada' 
                });
                setDeleteDialogVisible(false);
                loadReconciliations();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar la conciliación' 
            });
        }
    };

    // Template para estado
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

    // Template para fechas
    const dateBodyTemplate = (rowData: Reconciliation, field: string) => {
        return rowData[field as keyof Reconciliation] 
            ? new Date(rowData[field as keyof Reconciliation] as string).toLocaleDateString() 
            : '';
    };

    // Template para montos
    const amountBodyTemplate = (rowData: Reconciliation, field: string) => {
        const value = rowData[field as keyof Reconciliation] as number;
        return value ? `$${value.toFixed(2)}` : '$0.00';
    };

    // Template para los botones de acción
    const actionBodyTemplate = (rowData: Reconciliation) => {
        return (
            <div className="flex gap-2">
                <Button 
                    icon="pi pi-pencil" 
                    rounded 
                    text 
                    severity="info" 
                    onClick={() => openEdit(rowData)} 
                    tooltip="Editar"
                    tooltipOptions={{ position: 'top' }}
                />
                <Button 
                    icon="pi pi-trash" 
                    rounded 
                    text 
                    severity="danger" 
                    onClick={() => openDelete(rowData)} 
                    tooltip="Eliminar"
                    tooltipOptions={{ position: 'top' }}
                />
            </div>
        );
    };

    // Header de la tabla
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Conciliaciones</span>
            <div className="flex gap-2">
                <Button 
                    label="Nuevo" 
                    icon="pi pi-plus" 
                    severity="success" 
                    onClick={openNew} 
                />
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

    // Footer del diálogo
    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={saveReconciliation} />
        </div>
    );

    // Footer del diálogo de eliminar
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

            {/* Diálogo para Crear/Editar */}
            <Dialog
                visible={dialogVisible}
                style={{ width: '600px' }}
                header={isEditing ? "Editar Conciliación" : "Nueva Conciliación"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="account_id">ID de Cuenta *</label>
                    <InputNumber
                        id="account_id"
                        value={selectedReconciliation.account_id}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, account_id: e.value || 0 })}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="year">Año *</label>
                    <InputNumber
                        id="year"
                        value={selectedReconciliation.year}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, year: e.value || 2025 })}
                        required
                        min={2000}
                        max={2100}
                    />
                </div>
                <div className="field">
                    <label htmlFor="month">Mes *</label>
                    <InputNumber
                        id="month"
                        value={selectedReconciliation.month}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, month: e.value || 1 })}
                        required
                        min={1}
                        max={12}
                    />
                </div>
                <div className="field">
                    <label htmlFor="start_date">Fecha Inicio *</label>
                    <Calendar
                        id="start_date"
                        value={selectedReconciliation.start_date ? new Date(selectedReconciliation.start_date) : null}
                        onChange={(e) => setSelectedReconciliation({ 
                            ...selectedReconciliation, 
                            start_date: e.value ? (e.value as Date).toISOString().split('T')[0] : '' 
                        })}
                        dateFormat="yy-mm-dd"
                        showIcon
                    />
                </div>
                <div className="field">
                    <label htmlFor="end_date">Fecha Fin *</label>
                    <Calendar
                        id="end_date"
                        value={selectedReconciliation.end_date ? new Date(selectedReconciliation.end_date) : null}
                        onChange={(e) => setSelectedReconciliation({ 
                            ...selectedReconciliation, 
                            end_date: e.value ? (e.value as Date).toISOString().split('T')[0] : '' 
                        })}
                        dateFormat="yy-mm-dd"
                        showIcon
                    />
                </div>
                <div className="field">
                    <label htmlFor="bank_initial_balance">Saldo Inicial Banco</label>
                    <InputNumber
                        id="bank_initial_balance"
                        value={selectedReconciliation.bank_initial_balance}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, bank_initial_balance: e.value || 0 })}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                    />
                </div>
                <div className="field">
                    <label htmlFor="bank_final_balance">Saldo Final Banco</label>
                    <InputNumber
                        id="bank_final_balance"
                        value={selectedReconciliation.bank_final_balance}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, bank_final_balance: e.value || 0 })}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                    />
                </div>
                <div className="field">
                    <label htmlFor="book_initial_balance">Saldo Inicial Libros</label>
                    <InputNumber
                        id="book_initial_balance"
                        value={selectedReconciliation.book_initial_balance}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, book_initial_balance: e.value || 0 })}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                    />
                </div>
                <div className="field">
                    <label htmlFor="book_final_balance">Saldo Final Libros</label>
                    <InputNumber
                        id="book_final_balance"
                        value={selectedReconciliation.book_final_balance}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, book_final_balance: e.value || 0 })}
                        mode="currency"
                        currency="USD"
                        locale="en-US"
                    />
                </div>
                <div className="field">
                    <label htmlFor="status">Estado</label>
                    <Dropdown
                        id="status"
                        value={selectedReconciliation.status}
                        options={statusOptions}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, status: e.value })}
                        placeholder="Seleccione un estado"
                    />
                </div>
                <div className="field">
                    <label htmlFor="observations">Observaciones</label>
                    <InputText
                        id="observations"
                        value={selectedReconciliation.observations || ''}
                        onChange={(e) => setSelectedReconciliation({ ...selectedReconciliation, observations: e.target.value })}
                    />
                </div>
            </Dialog>

            {/* Diálogo para Confirmar Eliminación */}
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
                        ¿Estás seguro que deseas eliminar la conciliación del período {selectedReconciliation.month}/{selectedReconciliation.year}?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default ReconciliationsPage;