'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputMask } from 'primereact/inputmask';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import React, { useEffect, useRef, useState } from 'react';
import { usersService } from '@/src/service/users.service';
import { rolesService } from '@/src/service/roles.service';
import { User, Role } from '@/types';

const UsersPage = () => {
    // Estados
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, rolesData] = await Promise.all([
                usersService.getAll(),
                rolesService.getAll()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
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
        setSelectedUser({
            first_name: '',
            second_name: '',
            third_name: '',
            first_surname: '',
            second_surname: '',
            email: '',
            username: '',
            password: '',
            role_id: undefined
        });
        setIsEditing(false);
        setDialogVisible(true);
    };

    const openEdit = (user: User) => {
        setSelectedUser({ ...user });
        setIsEditing(true);
        setDialogVisible(true);
    };

    const openDelete = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogVisible(true);
    };

    const hideDialog = () => {
        setDialogVisible(false);
    };

    const hideDeleteDialog = () => {
        setDeleteDialogVisible(false);
    };

    const saveUser = async () => {
        try {
            if (isEditing && selectedUser.user_id) {
                await usersService.update(selectedUser.user_id, selectedUser);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Usuario actualizado' 
                });
            } else {
                await usersService.create(selectedUser as Omit<User, 'user_id'>);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Usuario creado' 
                });
            }
            setDialogVisible(false);
            loadData();
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo guardar el usuario' 
            });
        }
    };

    const deleteUser = async () => {
        try {
            if (selectedUser.user_id) {
                await usersService.delete(selectedUser.user_id);
                toast.current?.show({ 
                    severity: 'success', 
                    summary: 'Éxito', 
                    detail: 'Usuario eliminado' 
                });
                setDeleteDialogVisible(false);
                loadData();
            }
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se pudo eliminar el usuario' 
            });
        }
    };

    // Template para mostrar nombre completo
    const fullNameBodyTemplate = (rowData: User) => {
        return `${rowData.first_name} ${rowData.first_surname}`;
    };

    // Template para rol
    const roleBodyTemplate = (rowData: User) => {
        const role = roles.find(r => r.role_id === rowData.role_id);
        return role ? role.role_name : `Rol ${rowData.role_id}`;
    };

    const actionBodyTemplate = (rowData: User) => {
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
            <span className="text-xl text-900 font-bold">Usuarios</span>
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
            <Button label={isEditing ? "Actualizar" : "Guardar"} icon="pi pi-check" onClick={saveUser} />
        </div>
    );

    const deleteDialogFooter = (
        <div className="flex justify-content-end gap-2">
            <Button label="No" icon="pi pi-times" text onClick={hideDeleteDialog} />
            <Button label="Sí" icon="pi pi-check" severity="danger" onClick={deleteUser} />
        </div>
    );

    return (
        <div className="grid">
            <Toast ref={toast} />
            
            <div className="col-12">
                <div className="card">
                    <DataTable
                        value={users}
                        loading={loading}
                        header={header}
                        globalFilter={globalFilter}
                        paginator
                        rows={10}
                        rowsPerPageOptions={[5, 10, 25]}
                        emptyMessage="No hay usuarios"
                        sortField="user_id"
                        sortOrder={1}
                    >
                        <Column field="user_id" header="ID" sortable style={{ minWidth: '6rem' }} />
                        <Column field="username" header="Usuario" sortable style={{ minWidth: '10rem' }} />
                        <Column header="Nombre Completo" body={fullNameBodyTemplate} sortable style={{ minWidth: '15rem' }} />
                        <Column field="email" header="Email" sortable style={{ minWidth: '15rem' }} />
                        <Column header="Rol" body={roleBodyTemplate} sortable style={{ minWidth: '10rem' }} />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>
                </div>
            </div>

            <Dialog
                visible={dialogVisible}
                style={{ width: '600px' }}
                header={isEditing ? "Editar Usuario" : "Nuevo Usuario"}
                modal
                className="p-fluid"
                footer={dialogFooter}
                onHide={hideDialog}
            >
                <div className="grid">
                    <div className="col-6">
                        <div className="field">
                            <label htmlFor="first_name">Primer Nombre *</label>
                            <InputText
                                id="first_name"
                                value={selectedUser.first_name || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, first_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="field">
                            <label htmlFor="second_name">Segundo Nombre *</label>
                            <InputText
                                id="second_name"
                                value={selectedUser.second_name || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, second_name: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="field">
                            <label htmlFor="third_name">Tercer Nombre</label>
                            <InputText
                                id="third_name"
                                value={selectedUser.third_name || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, third_name: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="field">
                            <label htmlFor="first_surname">Primer Apellido *</label>
                            <InputText
                                id="first_surname"
                                value={selectedUser.first_surname || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, first_surname: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="field">
                            <label htmlFor="second_surname">Segundo Apellido *</label>
                            <InputText
                                id="second_surname"
                                value={selectedUser.second_surname || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, second_surname: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="field">
                            <label htmlFor="email">Email *</label>
                            <InputText
                                id="email"
                                value={selectedUser.email || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="field">
                            <label htmlFor="username">Username *</label>
                            <InputText
                                id="username"
                                value={selectedUser.username || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, username: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-6">
                        <div className="field">
                            <label htmlFor="password">Contraseña *</label>
                            <Password
                                id="password"
                                value={selectedUser.password || ''}
                                onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                                feedback={false}
                                required
                            />
                        </div>
                    </div>
                    <div className="col-12">
                        <div className="field">
                            <label htmlFor="role_id">Rol *</label>
                            <Dropdown
                                id="role_id"
                                value={selectedUser.role_id}
                                options={roles.filter(r => r.active).map(r => ({ label: r.role_name, value: r.role_id }))}
                                onChange={(e) => setSelectedUser({ ...selectedUser, role_id: e.value })}
                                placeholder="Seleccione un rol"
                                required
                            />
                        </div>
                    </div>
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
                        ¿Estás seguro que deseas eliminar el usuario <b>{selectedUser.username}</b>?
                    </span>
                </div>
            </Dialog>
        </div>
    );
};

export default UsersPage;