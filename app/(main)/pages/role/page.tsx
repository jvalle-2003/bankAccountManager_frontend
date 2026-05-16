'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { MultiSelect } from 'primereact/multiselect';
import { InputSwitch } from 'primereact/inputswitch';
import { RoleService } from '../../../../src/service/role.service'; // Ajusta la ruta
import { PermissionsService } from '../../../../src/service/permissions.service'; 

const Role = () => {
    const emptyRole = {
        role_id: null,
        role_name: "",
        description: "",
        active: true,
        permissions: [] // Para almacenar los permisos seleccionados
    };

    // Estados
    const [roles, setRoles] = useState<any[]>([]);
    const [role, setRole] = useState<any>(emptyRole);
    const [availablePermissions, setAvailablePermissions] = useState<any[]>([]); // 👈 Estado para los permisos del selector
    const [roleDialog, setRoleDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    
    const toast = useRef<Toast>(null);

    // Cargar datos al iniciar
    useEffect(() => {
        loadRoles();
        loadPermissions();
    }, []);

    const loadRoles = async () => {
        const data = await RoleService.getAll();
        setRoles(data);
    };

    const loadPermissions = async () => {
        try {
            const data = await PermissionsService.getAll();
            setAvailablePermissions(data);
        } catch (error) {
            toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudieron cargar los permisos", life: 3000 });
        }
    };

    const openNew = () => {
        setRole(emptyRole);
        setRoleDialog(true);
    };

    const editRole = (rowData: any) => {
        // Asegurarnos de que si rowData.permissions es null, sea un arreglo vacío
        setRole({ ...rowData, permissions: rowData.permissions || [] });
        setRoleDialog(true);
    };

    const saveRole = async () => {
        // Validación: role_name es obligatorio
        if (!role.role_name.trim()) {
            toast.current?.show({ severity: "warn", summary: "Requerido", detail: "El nombre del rol es obligatorio", life: 3000 });
            return;
        }

        try {
            if (role.role_id) {
                await RoleService.update(role.role_id, role);
            } else {
                await RoleService.create(role);
            }

            toast.current?.show({ severity: "success", summary: "Éxito", detail: role.role_id ? "Rol actualizado" : "Rol creado", life: 3000 });
            setRoleDialog(false);
            loadRoles();
        } catch (error) {
            toast.current?.show({ severity: "error", summary: "Error", detail: "No se pudo guardar", life: 3000 });
        }
    };

    const deleteRole = async () => {
        await RoleService.delete(role.role_id);
        toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Rol eliminado", life: 3000 });
        setDeleteDialog(false);
        loadRoles();
    };

    // Templates
    const leftToolbarTemplate = () => (
        <Button label="Nuevo Rol" icon="pi pi-plus" severity="success" onClick={openNew} />
    );

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => editRole(rowData)} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setRole(rowData); setDeleteDialog(true); }} />
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable value={roles} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay roles registrados">
                        <Column field="role_id" header="ID" sortable />
                        <Column field="role_name" header="Nombre del Rol" sortable />
                        <Column field="description" header="Descripción" />
                        <Column 
                            header="Estado" 
                            body={(row) => row.active ? <span className="text-green-500 font-bold">Activo</span> : <span className="text-red-500">Inactivo</span>} 
                        />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>

                    {/* DIALOGO CREAR/EDITAR */}
                    <Dialog visible={roleDialog} style={{ width: '500px' }} header="Detalles del Rol" modal onHide={() => setRoleDialog(false)}
                        footer={<>
                            <Button label="Cancelar" icon="pi pi-times" text onClick={() => setRoleDialog(false)} />
                            <Button label="Guardar" icon="pi pi-check" onClick={saveRole} />
                        </>}>
                        
                        <div className="field">
                            <label htmlFor="role_name" className="font-bold">Nombre del Rol</label>
                            <InputText id="role_name" value={role.role_name} onChange={(e) => setRole({ ...role, role_name: e.target.value })} required className={!role.role_name ? 'p-invalid w-full' : 'w-full'} />
                        </div>

                        <div className="field">
                            <label htmlFor="description" className="font-bold">Descripción (Máx 10)</label>
                            <InputText id="description" value={role.description} onChange={(e) => setRole({ ...role, description: e.target.value })} maxLength={10} className="w-full" />
                        </div>

                        {/* 🌟 AQUÍ ESTÁ EL SELECTOR DE PERMISOS 🌟 */}
                        <div className="field">
                            <label htmlFor="permissions" className="font-bold">Permisos Asignados</label>
                            <MultiSelect 
                                id="permissions"
                                value={role.permissions} 
                                options={availablePermissions} 
                                onChange={(e) => setRole({ ...role, permissions: e.value })} 
                                optionLabel="permission_name" 
                                placeholder="Selecciona los permisos" 
                                display="chip"
                                filter
                                className="w-full" 
                                emptyMessage="No hay permisos disponibles"
                            />
                        </div>

                        <div className="field flex align-items-center gap-2 mt-4">
                            <label htmlFor="active" className="font-bold mb-0">¿Activo?</label>
                            <InputSwitch id="active" checked={role.active} onChange={(e) => setRole({ ...role, active: e.value })} />
                        </div>
                    </Dialog>

                    {/* DIALOGO ELIMINAR */}
                    <Dialog visible={deleteDialog} style={{ width: '400px' }} header="Confirmar" modal onHide={() => setDeleteDialog(false)}
                        footer={<>
                            <Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} />
                            <Button label="Sí" icon="pi pi-check" text onClick={deleteRole} severity="danger" />
                        </>}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            <span>¿Seguro que desea eliminar <b>{role.role_name}</b>?</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default Role;