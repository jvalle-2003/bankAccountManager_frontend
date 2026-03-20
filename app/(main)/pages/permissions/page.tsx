'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { permissionsService } from '@/src/service/permissions.service';
import { Permission } from '@/types';

const PermissionsPage = () => {
    // Estados
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState<Partial<Permission>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    // Referencias
    const toast = useRef<Toast>(null);

    // Cargar datos al iniciar
    useEffect(() => {
        loadPermissions();
    }, []);

    // Función para cargar permisos
    const loadPermissions = async () => {
        setLoading(true);
        try {
            const data = await permissionsService.getAll();
            setPermissions(data);
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudieron cargar los permisos' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Abrir diálogo para nuevo permiso
    const openNew = () => {
        setSelectedPermission({});
        setIsEditing(false);
        setDialogVisible(true);
    };

    // Abrir diálogo para editar
    const openEdit = (permission: Permission) => {
        setSelectedPermission({ ...permission });
        setIsEditing(true);
        setDialogVisible(true);
    };

    // Abrir diálogo para eliminar
    const openDelete = (permission: Permission) => {
        setSelectedPermission(permission);
        setDeleteDialogVisible(true);
    };

    // Cerrar diálogos
    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    // Guardar permiso (crear o actualizar)
    const savePermission = async () => {
        try {
            if (isEditing && selectedPermission.id_permission) {
                await permissionsService.update(selectedPermission.id_permission, selectedPermission);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Permiso actualizado' 
                });
            } else {
                await permissionsService.create(selectedPermission as Omit<Permission, 'id_permission'>);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Permiso creado' 
                });
            }
            setDialogVisible(false);
            loadPermissions(); // Recargar la tabla
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo guardar el permiso' 
            });
        }
    };

    // Eliminar permiso
    const deletePermission = async () => {
        try {
            if (selectedPermission.id_permission) {
                await permissionsService.delete(selectedPermission.id_permission);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Permiso eliminado' 
                });
                setDeleteDialogVisible(false);
                loadPermissions(); // Recargar la tabla
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar el permiso' 
            });
        }
    };

    // Template para los botones de acción
    const actionBodyTemplate = (rowData: Permission) => {
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

    // Header de la tabla con título y búsqueda
    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Permisos</span>
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

    // Footer del diálogo de crear/editar
    const dialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button 
                label="Cancelar" 
                icon="pi pi-times" 
                text 
                onClick={hideDialog} 
            />
            <Button 
                label={isEditing ? "Actualizar" : "Guardar"} 
                icon="pi pi-check" 
                onClick={savePermission} 
            />
        </div>
    );

    // Footer del diálogo de eliminar
    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button 
                label="No" 
                icon="pi pi-times" 
                text 
                onClick={hideDeleteDialog} 
            />
            <Button 
                label="Sí" 
                icon="pi pi-check" 
                severity="danger" 
                onClick={deletePermission} 
            />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={permissions}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        className="datatable-responsive"
                        emptyMessage="No se encontraron permisos"
                        sortField="id_permission"
                        sortOrder={1}
                    >
                        <Column 
                            field="id_permission" 
                            header="ID" 
                            sortable 
                            style={{ minWidth: '8rem' }} 
                        />
                        <Column 
                            field="permission_name" 
                            header="Nombre" 
                            sortable 
                            style={{ minWidth: '14rem' }} 
                        />
                        <Column 
                            field="description" 
                            header="Descripción" 
                            sortable 
                            style={{ minWidth: '20rem' }} 
                        />
                        <Column 
                            field="module" 
                            header="Módulo" 
                            sortable 
                            style={{ minWidth: '10rem' }} 
                        />
                        <Column 
                            body={actionBodyTemplate} 
                            header="Acciones" 
                            style={{ minWidth: '10rem' }} 
                        />
                    </DataTable>
                </div>
            </div>

            {/* Diálogo para Crear/Editar */}
            <Dialog
                visible={dialogVisible}
                style={{ width: '450px' }}
                header={isEditing ? "Editar Permiso" : "Nuevo Permiso"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="permission_name">Nombre *</label>
                    <InputText
                        id="permission_name"
                        value={selectedPermission.permission_name || ''}
                        onChange={(e) => setSelectedPermission({ 
                            ...selectedPermission, 
                            permission_name: e.target.value 
                        })}
                        required
                        autoFocus
                    />
                </div>
                <div className="field">
                    <label htmlFor="description">Descripción</label>
                    <InputText
                        id="description"
                        value={selectedPermission.description || ''}
                        onChange={(e) => setSelectedPermission({ 
                            ...selectedPermission, 
                            description: e.target.value 
                        })}
                    />
                </div>
                <div className="field">
                    <label htmlFor="module">Módulo</label>
                    <InputText
                        id="module"
                        value={selectedPermission.module || ''}
                        onChange={(e) => setSelectedPermission({ 
                            ...selectedPermission, 
                            module: e.target.value 
                        })}
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
                        ¿Estás seguro que deseas eliminar <b>{selectedPermission.permission_name}</b>?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default PermissionsPage;