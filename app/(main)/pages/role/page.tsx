'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import { Checkbox } from 'primereact/checkbox';
import { ScrollPanel } from 'primereact/scrollpanel';
import { RoleService } from '../../../../src/service/role.service';
import { PermissionsService } from '../../../../src/service/permissions.service';
import { rolePermissionsService } from '../../../../src/service/rolePermissions.service';

const Role = () => {
    const emptyRole = {
        role_id: null,
        role_name: '',
        description: '',
        active: true,
        permissions: []
    };

    // Estados
    const [roles, setRoles] = useState<any[]>([]);
    const [role, setRole] = useState<any>(emptyRole);
    const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
    const [roleDialog, setRoleDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [permissionsDialog, setPermissionsDialog] = useState(false);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [currentRoleForPermissions, setCurrentRoleForPermissions] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const toast = useRef<Toast>(null);

    // Cargar datos al iniciar
    useEffect(() => {
        loadRoles();
        loadPermissions();
    }, []);

    const loadRoles = async () => {
        try {
            const data = await RoleService.getAll();
            // Cargar los permisos para cada rol
            const rolesWithPermissions = await Promise.all(
                data.map(async (rol: any) => {
                    const permissions = await rolePermissionsService.getByRole(rol.role_id);
                    return {
                        ...rol,
                        permissions: permissions.map((p: any) => p.permission_id)
                    };
                })
            );
            setRoles(rolesWithPermissions);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles', life: 3000 });
        }
    };

    const loadPermissions = async () => {
        try {
            const data = await PermissionsService.getAll();
            const sortedData = data.sort((a: any, b: any) => {
                if (a.module !== b.module) return (a.module || '').localeCompare(b.module || '');
                return (a.permission_name || '').localeCompare(b.permission_name || '');
            });
            setAvailablePermissions(sortedData);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los permisos', life: 3000 });
        }
    };

    const openNew = () => {
        setRole(emptyRole);
        setRoleDialog(true);
    };

    const editRole = async (rowData: any) => {
        try {
            const permissions = await rolePermissionsService.getByRole(rowData.role_id);
            const permissionIds = permissions.map((p: any) => p.permission_id);

            setRole({
                ...rowData,
                permissions: permissionIds
            });
            setRoleDialog(true);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los permisos del rol', life: 3000 });
        }
    };

    // Abrir modal de permisos para un rol
    const openPermissionsModal = async (rowData: any) => {
        setPermissionsLoading(true);
        setCurrentRoleForPermissions(rowData);

        try {
            const permissions = await rolePermissionsService.getByRole(rowData.role_id);
            const permissionIds = permissions.map((p: any) => p.permission_id);
            setSelectedPermissions(permissionIds);
            setPermissionsDialog(true);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los permisos', life: 3000 });
        } finally {
            setPermissionsLoading(false);
        }
    };

    // Guardar permisos desde el modal
    const savePermissions = async () => {
        if (!currentRoleForPermissions) return;

        setPermissionsLoading(true);

        try {
            // Obtener permisos actuales del rol
            const currentPermissions = await rolePermissionsService.getByRole(currentRoleForPermissions.role_id);
            const currentPermissionIds = currentPermissions.map((p: any) => p.permission_id);

            // Permisos a eliminar (los que estaban pero ya no están)
            const toDelete = currentPermissionIds.filter((id: number) => !selectedPermissions.includes(id));

            // Permisos a agregar (los nuevos)
            const toAdd = selectedPermissions.filter((id: number) => !currentPermissionIds.includes(id));

            // Eliminar permisos que ya no tiene
            for (const permId of toDelete) {
                await rolePermissionsService.delete(currentRoleForPermissions.role_id, permId);
            }

            // Agregar nuevos permisos (manejando el ID 0 correctamente)
            for (const permId of toAdd) {
                // Asegurarse de que el ID no sea null o undefined
                const permissionId = Number(permId);
                if (!isNaN(permissionId)) {
                    await rolePermissionsService.create({
                        role_id: currentRoleForPermissions.role_id,
                        permission_id: permissionId,
                        assignment_date: new Date().toISOString()
                    });
                }
            }

            toast.current?.show({
                severity: 'success',
                summary: 'Éxito',
                detail: `Permisos actualizados para el rol ${currentRoleForPermissions.role_name}`,
                life: 3000
            });

            setPermissionsDialog(false);
            await loadRoles(); // Recargar la lista para mostrar los cambios
        } catch (error) {
            console.error('Error al guardar permisos:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron guardar los permisos', life: 3000 });
        } finally {
            setPermissionsLoading(false);
        }
    };

    // Toggle de permiso individual
    const togglePermission = (permissionId: number) => {
        if (selectedPermissions.includes(permissionId)) {
            setSelectedPermissions(selectedPermissions.filter((id) => id !== permissionId));
        } else {
            setSelectedPermissions([...selectedPermissions, permissionId]);
        }
    };

    // Seleccionar todos los permisos
    const selectAllPermissions = () => {
        const allIds = availablePermissions.map((p) => p.id_permission || p.permission_id);
        setSelectedPermissions(allIds);
    };

    // Deseleccionar todos los permisos
    const deselectAllPermissions = () => {
        setSelectedPermissions([]);
    };

    const saveRole = async () => {
        if (!role.role_name.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Requerido', detail: 'El nombre del rol es obligatorio', life: 3000 });
            return;
        }

        setLoading(true);

        try {
            let savedRole;

            if (role.role_id) {
                await RoleService.update(role.role_id, {
                    role_name: role.role_name,
                    description: role.description,
                    active: role.active
                });
                savedRole = role;

                const currentPermissions = await rolePermissionsService.getByRole(role.role_id);
                const currentPermissionIds = currentPermissions.map((p: any) => p.permission_id);

                const toDelete = currentPermissionIds.filter((id: number) => !role.permissions.includes(id));
                const toAdd = role.permissions.filter((id: number) => !currentPermissionIds.includes(id));

                for (const permId of toDelete) {
                    await rolePermissionsService.delete(role.role_id, permId);
                }

                for (const permId of toAdd) {
                    await rolePermissionsService.create({
                        role_id: role.role_id,
                        permission_id: permId,
                        assignment_date: new Date().toISOString()
                    });
                }

                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Rol actualizado correctamente', life: 3000 });
            } else {
                const newRole = await RoleService.create({
                    role_name: role.role_name,
                    description: role.description,
                    active: role.active
                });
                savedRole = newRole;

                for (const permId of role.permissions) {
                    await rolePermissionsService.create({
                        role_id: newRole.role_id,
                        permission_id: permId,
                        assignment_date: new Date().toISOString()
                    });
                }

                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Rol creado correctamente', life: 3000 });
            }

            setRoleDialog(false);
            await loadRoles();
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el rol', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const deleteRole = async () => {
        try {
            const permissions = await rolePermissionsService.getByRole(role.role_id);
            for (const perm of permissions) {
                await rolePermissionsService.delete(role.role_id, perm.permission_id);
            }

            await RoleService.delete(role.role_id);

            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Rol eliminado correctamente', life: 3000 });
            setDeleteDialog(false);
            await loadRoles();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el rol', life: 3000 });
        }
    };

    // Template para mostrar los permisos con botón
    const permissionsBodyTemplate = (rowData: any) => {
        return (
            <div className="flex justify-content-between align-items-center gap-2">
                <Button icon="pi pi-cog" rounded text severity="info" size="small" onClick={() => openPermissionsModal(rowData)} tooltip="Gestionar permisos" tooltipOptions={{ position: 'top' }} />
            </div>
        );
    };

    const renderPermissionsModal = () => {
        if (!currentRoleForPermissions) return null;

        const grouped = availablePermissions.reduce((acc: any, perm: any) => {
            const module = perm.module || 'Otros';
            if (!acc[module]) {
                acc[module] = [];
            }
            acc[module].push(perm);
            return acc;
        }, {});

        return (
            <Dialog
                visible={permissionsDialog}
                style={{ width: '700px', maxWidth: '90vw' }}
                header={`Gestionar Permisos - ${currentRoleForPermissions.role_name}`}
                modal
                onHide={() => setPermissionsDialog(false)}
                footer={
                    <div className="flex justify-content-between w-full">
                        <div>
                            <Button label="Seleccionar Todos" icon="pi pi-check-square" text size="small" onClick={selectAllPermissions} />
                            <Button label="Deseleccionar Todos" icon="pi pi-times-circle" text size="small" onClick={deselectAllPermissions} className="ml-2" />
                        </div>
                        <div>
                            <Button label="Cancelar" icon="pi pi-times" text onClick={() => setPermissionsDialog(false)} />
                            <Button label="Guardar" icon="pi pi-check" onClick={savePermissions} loading={permissionsLoading} />
                        </div>
                    </div>
                }
            >
                <div className="permissions-modal">
                    <div className="mb-3 text-500 text-sm">
                        <i className="pi pi-info-circle mr-2"></i>
                        Seleccione los permisos que tendrá este rol. Los cambios se aplicarán inmediatamente.
                    </div>

                    {permissionsLoading && !availablePermissions.length ? (
                        <div className="flex justify-content-center p-4">
                            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
                        </div>
                    ) : (
                        <ScrollPanel style={{ width: '100%', height: '500px' }}>
                            <div className="p-2">
                                {Object.entries(grouped).map(([moduleName, modulePerms]: [string, any]) => (
                                    <div key={moduleName} className="mb-4">
                                        <div className="font-bold text-md p-2 bg-gray-100 border-round mb-2">{moduleName}</div>
                                        <div className="grid ml-2">
                                            {modulePerms.map((perm: any) => {
                                                const permId = perm.id_permission ?? perm.permission_id;
                                                return (
                                                    <div key={permId} className="col-12 md:col-6">
                                                        <div className="flex align-items-center gap-2 p-1">
                                                            <Checkbox inputId={`perm_${permId}`} checked={selectedPermissions.includes(permId)} onChange={() => togglePermission(permId)} />
                                                            <label htmlFor={`perm_${permId}`} className="text-sm cursor-pointer">
                                                                {/* <span className="font-semibold">{perm.permission_name}</span>
                                                                <br /> */}
                                                                <span className="font-semibold">{perm.description}</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollPanel>
                    )}

                    <div className="mt-3 p-3 bg-blue-50 border-round">
                        <div className="flex align-items-center gap-2">
                            <i className="pi pi-chart-line text-blue-600"></i>
                            <span className="font-semibold">Resumen:</span>
                            <span className="text-sm">
                                {selectedPermissions.length} de {availablePermissions.length} permisos seleccionados
                            </span>
                        </div>
                    </div>
                </div>
            </Dialog>
        );
    };

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => editRole(rowData)} />
            <Button
                icon="pi pi-trash"
                rounded
                severity="danger"
                onClick={() => {
                    setRole(rowData);
                    setDeleteDialog(true);
                }}
            />
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={() => <Button label="Nuevo Rol" icon="pi pi-plus" severity="success" onClick={openNew} />} />

                    <DataTable value={roles} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay roles registrados" loading={loading}>
                        <Column field="role_id" header="ID" sortable style={{ width: '80px' }} />
                        <Column field="role_name" header="Nombre del Rol" sortable />
                        <Column field="description" header="Descripción" />
                        <Column header="Permisos" body={permissionsBodyTemplate} style={{ minWidth: '200px' }} />
                        <Column header="Estado" body={(row) => (row.active ? <span className="text-green-500 font-bold">Activo</span> : <span className="text-red-500">Inactivo</span>)} style={{ width: '100px' }} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ width: '120px' }} />
                    </DataTable>

                    {/* DIALOGO CREAR/EDITAR ROL */}
                    <Dialog
                        visible={roleDialog}
                        style={{ width: '500px' }}
                        header="Detalles del Rol"
                        modal
                        onHide={() => setRoleDialog(false)}
                        footer={
                            <>
                                <Button label="Cancelar" icon="pi pi-times" text onClick={() => setRoleDialog(false)} />
                                <Button label="Guardar" icon="pi pi-check" onClick={saveRole} loading={loading} />
                            </>
                        }
                    >
                        <div className="field">
                            <label htmlFor="role_name" className="font-bold">
                                Nombre del Rol *
                            </label>
                            <InputText id="role_name" value={role.role_name} onChange={(e) => setRole({ ...role, role_name: e.target.value })} required className={!role.role_name ? 'p-invalid w-full' : 'w-full'} />
                        </div>

                        <div className="field">
                            <label htmlFor="description" className="font-bold">
                                Descripción
                            </label>
                            <InputText id="description" value={role.description} onChange={(e) => setRole({ ...role, description: e.target.value })} maxLength={100} className="w-full" />
                        </div>

                        <div className="field flex align-items-center gap-2 mt-4">
                            <label htmlFor="active" className="font-bold mb-0">
                                ¿Activo?
                            </label>
                            <InputSwitch id="active" checked={role.active} onChange={(e) => setRole({ ...role, active: e.value })} />
                        </div>

                        <div className="field mt-3">
                            <label className="font-bold">Permisos</label>
                            <div className="text-500 text-sm">Para gestionar los permisos, guarde el rol primero y luego use el botón ⚙️ en la columna de permisos</div>
                        </div>
                    </Dialog>

                    {/* DIALOGO ELIMINAR */}
                    <Dialog
                        visible={deleteDialog}
                        style={{ width: '400px' }}
                        header="Confirmar Eliminación"
                        modal
                        onHide={() => setDeleteDialog(false)}
                        footer={
                            <>
                                <Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} />
                                <Button label="Sí, Eliminar" icon="pi pi-check" text onClick={deleteRole} severity="danger" />
                            </>
                        }
                    >
                        <div className="flex align-items-center justify-content-center gap-3">
                            <i className="pi pi-exclamation-triangle text-3xl text-orange-500" />
                            <span>
                                ¿Seguro que desea eliminar el rol <b>{role.role_name}</b>?
                            </span>
                        </div>
                    </Dialog>

                    {/* MODAL DE PERMISOS */}
                    {renderPermissionsModal()}
                </div>
            </div>
        </div>
    );
};

export default Role;
