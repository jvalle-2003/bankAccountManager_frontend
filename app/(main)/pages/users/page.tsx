'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { Password } from 'primereact/password';

import { UserService } from '../../../../src/service/user.service';
import { RoleService } from '../../../../src/service/role.service';

const UserPage = () => {
    // Estructura exacta de tu modelo de Sequelize
    const emptyUser = {
        user_id: null,
        first_name: "",
        second_name: "",
        third_name: "",
        first_surname: "",
        second_surname: "",
        email: "",
        username: "",
        password: "",
        role_id: null
    };

    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(emptyUser);
    const [userDialog, setUserDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);

    const toast = useRef<Toast>(null);

    // ===============================
    // CARGA DE DATOS
    // ===============================
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [userData, roleData] = await Promise.all([
                UserService.getAll(),
                RoleService.getAll()
            ]);

            const nuevo = userData.map(itme => {
                const role = roleData.find((r: any) => r.role_id === itme.role_id);


                return { ...itme, role_name: role.role_name };

            })

                console.log("Usuarios:", nuevo);






            setUsers(nuevo);
            setRoles(roleData);
        } catch (error) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: "Error al conectar con el servidor",
                life: 3000
            });
        }
    };

    // ===============================
    // ACCIONES (CREAR / EDITAR)
    // ===============================
    const openNew = () => {
        setUser(emptyUser);
        setUserDialog(true);
    };

    const editUser = (rowData: any) => {
        // Clonamos el objeto para no editar la fila de la tabla directamente
        setUser({ ...rowData });
        setUserDialog(true);
    };

    const hideDialog = () => setUserDialog(false);

    const saveUser = async () => {
        // Validación de campos obligatorios según tu modelo (allowNull: false)
        if (!user.first_name || !user.first_surname || !user.second_surname || !user.email || !user.username || (!user.user_id && !user.password) || !user.role_id) {
            toast.current?.show({
                severity: "warn",
                summary: "Atención",
                detail: "Por favor complete los campos obligatorios (*)",
                life: 3000
            });
            return;
        }

        try {
            if (user.user_id) {
                await UserService.update(user.user_id, user);
            } else {
                await UserService.create(user);
            }

            toast.current?.show({
                severity: "success",
                summary: "Éxito",
                detail: user.user_id ? "Usuario actualizado" : "Usuario creado",
                life: 3000
            });

            setUserDialog(false);
            loadData();
        } catch (error: any) {
            toast.current?.show({
                severity: "error",
                summary: "Error",
                detail: error.response?.data?.message || "Error al guardar el usuario",
                life: 3000
            });
        }
    };

    // ===============================
    // ELIMINACIÓN (FÍSICA)
    // ===============================
    const confirmDelete = (rowData: any) => {
        setUser(rowData);
        setDeleteDialog(true);
    };

    const deleteUser = async () => {
        try {
            await UserService.delete(user.user_id);
            toast.current?.show({
                severity: "success",
                summary: "Confirmado",
                detail: "El usuario ha sido eliminado permanentemente",
                life: 3000
            });
            setDeleteDialog(false);
            loadData();
        } catch (error: any) {
            toast.current?.show({
                severity: "error",
                summary: "Error de integridad",
                detail: "No se puede eliminar un usuario con registros asociados",
                life: 4000
            });
            setDeleteDialog(false);
        }
    };

    // ===============================
    // TEMPLATES DE TABLA
    // ===============================
    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => editUser(rowData)} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => confirmDelete(rowData)} />
        </div>
    );

    const fullNameTemplate = (rowData: any) => {
        return `${rowData.first_name} ${rowData.first_surname} ${rowData.second_surname}`;
    };

    const leftToolbarTemplate = () => (
        <Button label="Nuevo Usuario" icon="pi pi-plus" severity="success" onClick={openNew} />
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={leftToolbarTemplate} />

                    <DataTable 
                        value={users} 
                        paginator 
                        rows={10} 
                        responsiveLayout="scroll" 
                        emptyMessage="No se encontraron usuarios activos."
                    >
                        <Column field="username" header="Username" sortable />
                        <Column header="Nombre Completo" body={fullNameTemplate} sortable />
                        <Column field="email" header="Email" sortable />
                        {/* Se asume que el backend incluye el objeto Role: include: [Role] */}
                        <Column field="role_name" header="Rol" sortable />
                        <Column body={actionBodyTemplate} header="Acciones" style={{ minWidth: '10rem' }} />
                    </DataTable>

                    {/* DIÁLOGO DE FORMULARIO */}
                    <Dialog visible={userDialog} style={{ width: '600px' }} header="Gestión de Usuario" modal className="p-fluid" onHide={hideDialog} 
                        footer={<><Button label="Cancelar" icon="pi pi-times" text onClick={hideDialog} /><Button label="Guardar" icon="pi pi-check" text onClick={saveUser} /></>}>
                        
                        <div className="formgrid grid">
                            <div className="field col-12 md:col-4">
                                <label>Primer Nombre *</label>
                                <InputText value={user.first_name} onChange={(e) => setUser({ ...user, first_name: e.target.value })} maxLength={15} />
                            </div>
                            <div className="field col-12 md:col-4">
                                <label>Segundo Nombre</label>
                                <InputText value={user.second_name} onChange={(e) => setUser({ ...user, second_name: e.target.value })} maxLength={15} />
                            </div>
                            <div className="field col-12 md:col-4">
                                <label>Tercer Nombre</label>
                                <InputText value={user.third_name} onChange={(e) => setUser({ ...user, third_name: e.target.value })} maxLength={15} />
                            </div>
                        </div>

                        <div className="formgrid grid">
                            <div className="field col-12 md:col-6">
                                <label>Primer Apellido *</label>
                                <InputText value={user.first_surname} onChange={(e) => setUser({ ...user, first_surname: e.target.value })} maxLength={15} />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label>Segundo Apellido *</label>
                                <InputText value={user.second_surname} onChange={(e) => setUser({ ...user, second_surname: e.target.value })} maxLength={15} />
                            </div>
                        </div>

                        <div className="field">
                            <label>Email *</label>
                            <InputText value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} maxLength={50} />
                        </div>

                        <div className="formgrid grid">
                            <div className="field col-12 md:col-6">
                                <label>Username *</label>
                                <InputText value={user.username} onChange={(e) => setUser({ ...user, username: e.target.value })} maxLength={50} />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label>Rol *</label>
                                <Dropdown 
                                    value={user.role_id} 
                                    options={roles} 
                                    onChange={(e) => setUser({ ...user, role_id: e.value })} 
                                    optionLabel="role_name" 
                                    optionValue="role_id" 
                                    placeholder="Seleccione Rol" 
                                />
                            </div>
                        </div>

                        {/* Solo mostrar password si es un usuario nuevo */}
                        {!user.user_id && (
                            <div className="field">
                                <label>Contraseña *</label>
                                <Password 
                                    value={user.password} 
                                    onChange={(e: any) => setUser({ ...user, password: e.target.value })} 
                                    toggleMask 
                                    feedback={false} 
                                    maxLength={20} 
                                />
                            </div>
                        )}
                    </Dialog>

                    {/* DIÁLOGO DE CONFIRMACIÓN DE ELIMINAR */}
                    <Dialog visible={deleteDialog} style={{ width: '450px' }} header="Confirmar Eliminación" modal onHide={() => setDeleteDialog(false)}
                        footer={<><Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} /><Button label="Sí, Eliminar" icon="pi pi-check" text onClick={deleteUser} /></>}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: 'red' }} />
                            <span>¿Está seguro de que desea eliminar permanentemente al usuario <b>{user.username}</b>? Esta acción no se puede deshacer.</span>
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default UserPage;