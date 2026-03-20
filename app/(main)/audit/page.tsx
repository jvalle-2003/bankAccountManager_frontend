'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { auditService } from '@/src/service/audit.service';
import { usersService } from '@/src/service/users.service';
import { Audit, User } from '@/types';

const AuditPage = () => {
    // Estados
    const [audits, setAudits] = useState<Audit[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<Partial<Audit>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [auditsData, usersData] = await Promise.all([
                auditService.getAll(),
                usersService.getAll()
            ]);
            setAudits(auditsData);
            setUsers(usersData);
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudieron cargar los datos' 
            });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setSelectedAudit({
            description: '',
            last_login: new Date(),
            last_activity: new Date(),
            last_ip: '',
            user_id: undefined
        });
        setIsEditing(false);
        setDialogVisible(true);
    };

    const openEdit = (audit: Audit) => {
        setSelectedAudit({ ...audit });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (audit: Audit) => {
        setSelectedAudit(audit);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    const saveAudit = async () => {
        try {
            if (isEditing && selectedAudit.audit_id) {
                await auditService.update(selectedAudit.audit_id, selectedAudit);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Registro de auditoría actualizado' 
                });
            } else {
                await auditService.create(selectedAudit as Omit<Audit, 'audit_id'>);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Registro de auditoría creado' 
                });
            }
            setDialogVisible(false);
            loadData();
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo guardar el registro' 
            });
        }
    };

    const deleteAudit = async () => {
        try {
            if (selectedAudit.audit_id) {
                await auditService.delete(selectedAudit.audit_id);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Registro de auditoría eliminado' 
                });
                setDeleteDialogVisible(false);
                loadData();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar el registro' 
            });
        }
    };

    // Template para usuario
    const userBodyTemplate = (rowData: Audit) => {
        const user = users.find(u => u.user_id === rowData.user_id);
        return user ? `${user.first_name} ${user.first_surname}` : `Usuario ${rowData.user_id}`;
    };

    // Template para fechas
    const dateBodyTemplate = (rowData: Audit, field: string) => {
        const date = rowData[field as keyof Audit] as string;
        return date ? new Date(date).toLocaleString() : '';
    };

    const actionBodyTemplate = (rowData: Audit) => {
        return (
            <div className="flex gap-2">
                <Button 
                    icon="pi pi-pencil" 
                    rounded 
                    text 
                    severity="info" 
                    onClick={() => openEdit(rowData)} 
                    tooltip="Editar"
                />
                <Button 
                    icon="pi pi-trash" 
                    rounded 
                    text 
                    severity="danger" 
                    onClick={() => openDelete(rowData)} 
                    tooltip="Eliminar"
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Auditoría</span>
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

    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} />
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={saveAudit} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteAudit} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={audits}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No hay registros de auditoría"
                        sortField="last_activity"
                        sortOrder={-1}
                    >
                        <Column field="audit_id" header="ID" sortable style={{ minWidth: '6rem' }} />
                        <Column header="Usuario" body={userBodyTemplate} sortable style={{ minWidth: '15rem' }} />
                        <Column field="description" header="Descripción" sortable style={{ minWidth: '20rem' }} />
                        <Column field="last_login" header="Último Login" body={(rowData) => dateBodyTemplate(rowData, 'last_login')} sortable style={{ minWidth: '15rem' }} />
                        <Column field="last_activity" header="Última Actividad" body={(rowData) => dateBodyTemplate(rowData, 'last_activity')} sortable style={{ minWidth: '15rem' }} />
                        <Column field="last_ip" header="IP" sortable style={{ minWidth: '10rem' }} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog
                visible={dialogVisible}
                style={{ width: '500px' }}
                header={isEditing ? "Editar Registro" : "Nuevo Registro"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="user_id">Usuario *</label>
                    <Dropdown
                        id="user_id"
                        value={selectedAudit.user_id}
                        options={users.map(u => ({ 
                            label: `${u.first_name} ${u.first_surname} - ${u.username}`, 
                            value: u.user_id 
                        }))}
                        onChange={(e) => setSelectedAudit({ ...selectedAudit, user_id: e.value })}
                        placeholder="Seleccione un usuario"
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="description">Descripción *</label>
                    <InputTextarea
                        id="description"
                        value={selectedAudit.description || ''}
                        onChange={(e) => setSelectedAudit({ ...selectedAudit, description: e.target.value })}
                        rows={3}
                        required
                    />
                </div>
                <div className="field">
                    <label htmlFor="last_ip">Dirección IP</label>
                    <InputText
                        id="last_ip"
                        value={selectedAudit.last_ip || ''}
                        onChange={(e) => setSelectedAudit({ ...selectedAudit, last_ip: e.target.value })}
                        placeholder="192.168.1.1"
                    />
                </div>
                <div className="field">
                    <label htmlFor="last_login">Último Login</label>
                    <Calendar
                        id="last_login"
                        value={selectedAudit.last_login ? new Date(selectedAudit.last_login) : null}
                        onChange={(e) => setSelectedAudit({ 
                            ...selectedAudit, 
                            last_login: e.value ? (e.value as Date).toISOString() : null 
                        })}
                        showTime
                        hourFormat="24"
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
                        ¿Estás seguro que deseas eliminar este registro de auditoría?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default AuditPage;