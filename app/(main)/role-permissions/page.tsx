'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { InputText } from 'primereact/inputtext';
import React, { useEffect, useRef, useState } from 'react';
import { rolePermissionsService } from '@/src/service/rolePermissions.service';
import { permissionsService } from '@/src/service/permissions.service';
// import { rolesService } from '@/src/service/roles.service'; // Cuando tengas Roles
import { RolePermission } from '@/types';

interface RoleOption {
    label: string;
    value: number;
}

interface PermissionOption {
    label: string;
    value: number;
}

const RolePermissionsPage = () => {
    // Estados
    const [assignments, setAssignments] = useState<RolePermission[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [permissions, setPermissions] = useState<PermissionOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Partial<RolePermission>>({});
    const [globalFilter, setGlobalFilter] = useState('');

    // Datos quemados mientras no tengas la tabla Roles
    const mockRoles: RoleOption[] = [
        { label: 'Administrador', value: 1 },
        { label: 'Gerente', value: 2 },
        { label: 'Analista', value: 3 },
        { label: 'Consultor', value: 4 },
        { label: 'Auditor', value: 5 }
    ];

    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Cargar asignaciones
            const assignmentsData = await rolePermissionsService.getAll();
            setAssignments(assignmentsData);

            // Cargar permisos (para el dropdown)
            const permsData = await permissionsService.getAll();
            setPermissions(permsData.map(p => ({
                label: p.permission_name,
                value: p.id_permission
            })));

            // Usar roles quemados por ahora
            setRoles(mockRoles);

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
        setSelectedAssignment({
            role_id: undefined,
            permission_id: undefined
        });
        setDialogVisible(true);
    };

    const openDelete = (assignment: RolePermission) => {
        setSelectedAssignment(assignment);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    const saveAssignment = async () => {
        try {
            if (selectedAssignment.role_id && selectedAssignment.permission_id) {
                await rolePermissionsService.create({
                    role_id: selectedAssignment.role_id,
                    permission_id: selectedAssignment.permission_id
                });
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Permiso asignado correctamente' 
                });
                setDialogVisible(false);
                loadData();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo asignar el permiso' 
            });
        }
    };

    const deleteAssignment = async () => {
        try {
            if (selectedAssignment.role_id && selectedAssignment.permission_id) {
                await rolePermissionsService.delete(
                    selectedAssignment.role_id, 
                    selectedAssignment.permission_id
                );
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Asignación eliminada' 
                });
                setDeleteDialogVisible(false);
                loadData();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar la asignación' 
            });
        }
    };

    // Templates
    const roleBodyTemplate = (rowData: RolePermission) => {
        const role = roles.find(r => r.value === rowData.role_id);
        return role ? role.label : `Rol ${rowData.role_id}`;
    };

    const permissionBodyTemplate = (rowData: RolePermission) => {
        const perm = permissions.find(p => p.value === rowData.permission_id);
        return perm ? perm.label : `Permiso ${rowData.permission_id}`;
    };

    const dateBodyTemplate = (rowData: RolePermission) => {
        return rowData.assignment_date 
            ? new Date(rowData.assignment_date).toLocaleString() 
            : '';
    };

    const actionBodyTemplate = (rowData: RolePermission) => {
        return (
            <div className="flex gap-2">
                <Button 
                    icon="pi pi-trash" 
                    rounded 
                    text 
                    severity="danger" 
                    onClick={() => openDelete(rowData)} 
                    tooltip="Eliminar asignación"
                />
            </div>
        );
    };

    const header = (
        <div className="flex flex-wrap align-items-center justify-content-between gap-2">
            <span className="text-xl text-900 font-bold">Asignación de Permisos a Roles</span>
            <div className="flex gap-2">
                <Button 
                    label="Asignar Permiso" 
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
            <Button label="Asignar" icon="pi pi-check" onClick={saveAssignment} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteAssignment} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={assignments}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        emptyMessage="No hay asignaciones"
                    >
                        <Column field="role_id" header="Rol" body={roleBodyTemplate} sortable />
                        <Column field="permission_id" header="Permiso" body={permissionBodyTemplate} sortable />
                        <Column field="assignment_date" header="Fecha Asignación" body={dateBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>
                </div>
            </div>

            <Dialog
                visible={dialogVisible}
                style={{ width: '450px' }}
                header="Asignar Permiso a Rol"
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="field">
                    <label htmlFor="role">Rol *</label>
                    <Dropdown
                        id="role"
                        value={selectedAssignment.role_id}
                        options={roles}
                        onChange={(e) => setSelectedAssignment({ ...selectedAssignment, role_id: e.value })}
                        placeholder="Seleccione un rol"
                    />
                </div>
                <div className="field">
                    <label htmlFor="permission">Permiso *</label>
                    <Dropdown
                        id="permission"
                        value={selectedAssignment.permission_id}
                        options={permissions}
                        onChange={(e) => setSelectedAssignment({ ...selectedAssignment, permission_id: e.value })}
                        placeholder="Seleccione un permiso"
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
                        ¿Estás seguro que deseas eliminar esta asignación?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default RolePermissionsPage;