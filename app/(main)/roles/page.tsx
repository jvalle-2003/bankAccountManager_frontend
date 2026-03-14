'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { rolesService } from '@/src/service/roles.service';
import { Role } from '@/types';

const RolesPage = () => {
    // Estados
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Partial<Role>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        setLoading(true);
        try {
            const data = await rolesService.getAll();
            setRoles(data);
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudieron cargar los roles' 
            });
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setSelectedRole({
            role_name: '',
            description: '',
            active: true
        });
        setIsEditing(false);
        setDialogVisible(true);
    };

    const openEdit = (role: Role) => {
        setSelectedRole({ ...role });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (role: Role) => {
        setSelectedRole(role);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    const saveRole = async () => {
        try {
            if (isEditing && selectedRole.role_id) {
                await rolesService.update(selectedRole.role_id, selectedRole);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Rol actualizado' 
                });
            } else {
                await rolesService.create(selectedRole as Omit<Role, 'role_id'>);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Rol creado' 
                });
            }
            setDialogVisible(false);
            loadRoles();
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo guardar el rol' 
            });
        }
    };

    const deleteRole = async () => {
        try {
            if (selectedRole.role_id) {
                await rolesService.delete(selectedRole.role_id);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Rol eliminado (desactivado)' 
                });
                setDeleteDialogVisible(false);
                loadRoles();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar el rol' 
            });
        }
    };

    // Template para estado activo/inactivo
    const activeBodyTemplate = (rowData: Role) => {
        return (
            <span className={`customer-badge ${rowData.active ? 'status-success' : 'status-danger'}`}>
                {rowData.active ? 'Activo' : 'Inactivo'}
            </span>
        );
    };

    const actionBodyTemplate = (rowData: Role) => {
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
            <span className="text-xl text-900 font-bold">Roles</span>
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
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={saveRole} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteRole} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={roles}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No hay roles"
                        sortField="role_id"
                        sortOrder={1}
                    >
                        <Column field="role_id" header="ID" sortable style={{ minWidth: '6rem' }} />
                        <Column field="role_name" header="Nombre" sortable style={{ minWidth: '12rem' }} />
                        <Column field="description" header="Descripción" sortable style={{ minWidth: '10rem' }} />
                        <Column field="active" header="Estado" sortable style={{ minWidth: '8rem' }} body={activeBodyTemplate} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog
                visible={dialogVisible}
                style={{ width: '450px' }}
                header={isEditing ? "Editar Rol" : "Nuevo Rol"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="role_name">Nombre *</label>
                    <InputText
                        id="role_name"
                        value={selectedRole.role_name || ''}
                        onChange={(e) => setSelectedRole({ ...selectedRole, role_name: e.target.value })}
                        required
                        autoFocus
                    />
                </div>
                <div className="field">
                    <label htmlFor="description">Descripción</label>
                    <InputText
                        id="description"
                        value={selectedRole.description || ''}
                        onChange={(e) => setSelectedRole({ ...selectedRole, description: e.target.value })}
                    />
                </div>
                <div className="field-checkbox">
                    <Checkbox
                        inputId="active"
                        checked={selectedRole.active || false}
                        onChange={(e) => setSelectedRole({ ...selectedRole, active: e.checked || false })}
                    />
                    <label htmlFor="active">Activo</label>
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
                        ¿Estás seguro que deseas eliminar el rol <b>{selectedRole.role_name}</b>?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default RolesPage;