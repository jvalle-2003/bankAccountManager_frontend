'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { periodsService } from '@/src/service/periods.service';
import { Period } from '@/types';

const PeriodsPage = () => {
    // Estados
    const [periods, setPeriods] = useState<Period[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<Partial<Period>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    // Referencias
    const toast = useRef<Toast>(null);

    // Cargar datos al iniciar
    useEffect(() => {
        loadPeriods();
    }, []);

    // Función para cargar períodos
    const loadPeriods = async () => {
        setLoading(true);
        try {
            const data = await periodsService.getAll();
            setPeriods(data);
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudieron cargar los períodos' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Abrir diálogo para nuevo período
    const openNew = () => {
        setSelectedPeriod({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            start_date: '',
            end_date: '',
            is_closed: false
        });
        setIsEditing(false);
        setDialogVisible(true);
    };

    // Abrir diálogo para editar
    const openEdit = (period: Period) => {
        setSelectedPeriod({ ...period });
        setIsEditing(true);
        setDialogVisible(true);
    };

    // Abrir diálogo para eliminar
    const openDelete = (period: Period) => {
        setSelectedPeriod(period);
        setDeleteDialogVisible(true);
    };

    // Cerrar diálogos
    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    // Guardar período (crear o actualizar)
    const savePeriod = async () => {
        try {
            if (isEditing && selectedPeriod.period_id) {
                await periodsService.update(selectedPeriod.period_id, selectedPeriod);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Período actualizado' 
                });
            } else {
                await periodsService.create(selectedPeriod as Omit<Period, 'period_id'>);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Período creado' 
                });
            }
            setDialogVisible(false);
            loadPeriods();
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo guardar el período' 
            });
        }
    };

    // Eliminar período
    const deletePeriod = async () => {
        try {
            if (selectedPeriod.period_id) {
                await periodsService.delete(selectedPeriod.period_id);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Período eliminado' 
                });
                setDeleteDialogVisible(false);
                loadPeriods();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar el período' 
            });
        }
    };

    // Template para estado (abierto/cerrado)
    const statusBodyTemplate = (rowData: Period) => {
        return (
            <span className={`customer-badge ${rowData.is_closed ? 'status-danger' : 'status-success'}`}>
                {rowData.is_closed ? 'Cerrado' : 'Abierto'}
            </span>
        );
    };

    // Template para fechas
    const dateBodyTemplate = (rowData: Period, field: string) => {
        return new Date(rowData[field as keyof Period] as string).toLocaleDateString();
    };

    // Template para los botones de acción
    const actionBodyTemplate = (rowData: Period) => {
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
            <span className="text-xl text-900 font-bold">Períodos</span>
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
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={savePeriod} />
        </div>
    );

    // Footer del diálogo de eliminar
    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deletePeriod} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={periods}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No se encontraron períodos"
                        sortField="year"
                        sortOrder={-1}
                    >
                        <Column field="period_id" header="ID" sortable style={{ minWidth: '6rem' }} />
                        <Column field="year" header="Año" sortable style={{ minWidth: '6rem' }} />
                        <Column field="month" header="Mes" sortable style={{ minWidth: '6rem' }} body={(rowData) => new Date(0, rowData.month - 1).toLocaleString('es', { month: 'long' })} />
                        <Column field="start_date" header="Fecha Inicio" sortable style={{ minWidth: '10rem' }} body={(rowData) => dateBodyTemplate(rowData, 'start_date')} />
                        <Column field="end_date" header="Fecha Fin" sortable style={{ minWidth: '10rem' }} body={(rowData) => dateBodyTemplate(rowData, 'end_date')} />
                        <Column field="is_closed" header="Estado" sortable style={{ minWidth: '8rem' }} body={statusBodyTemplate} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>
                </div>
            </div>

            {/* Diálogo para Crear/Editar */}
            <Dialog
                visible={dialogVisible}
                style={{ width: '500px' }}
                header={isEditing ? "Editar Período" : "Nuevo Período"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="year">Año *</label>
                    <InputNumber
                        id="year"
                        value={selectedPeriod.year}
                        onChange={(e) => setSelectedPeriod({ ...selectedPeriod, year: e.value || 0 })}
                        required
                        min={2000}
                        max={2100}
                    />
                </div>
                <div className="field">
                    <label htmlFor="month">Mes *</label>
                    <InputNumber
                        id="month"
                        value={selectedPeriod.month}
                        onChange={(e) => setSelectedPeriod({ ...selectedPeriod, month: e.value || 1 })}
                        required
                        min={1}
                        max={12}
                    />
                </div>
                <div className="field">
                    <label htmlFor="start_date">Fecha Inicio *</label>
                    <Calendar
                        id="start_date"
                        value={selectedPeriod.start_date ? new Date(selectedPeriod.start_date) : null}
                        onChange={(e) => setSelectedPeriod({ 
                            ...selectedPeriod, 
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
                        value={selectedPeriod.end_date ? new Date(selectedPeriod.end_date) : null}
                        onChange={(e) => setSelectedPeriod({ 
                            ...selectedPeriod, 
                            end_date: e.value ? (e.value as Date).toISOString().split('T')[0] : '' 
                        })}
                        dateFormat="yy-mm-dd"
                        showIcon
                    />
                </div>
                <div className="field-checkbox">
                    <Checkbox
                        inputId="is_closed"
                        checked={selectedPeriod.is_closed || false}
                        onChange={(e) => setSelectedPeriod({ ...selectedPeriod, is_closed: e.checked || false })}
                    />
                    <label htmlFor="is_closed">Cerrado</label>
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
                        ¿Estás seguro que deseas eliminar el período {selectedPeriod.year}-{selectedPeriod.month}?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default PeriodsPage;