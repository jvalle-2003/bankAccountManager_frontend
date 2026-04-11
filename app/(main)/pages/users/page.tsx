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
    let emptyUser = {
        user_id: null,
        first_name: '',
        second_name: '',
        third_name: '',
        first_surname: '',
        second_surname: '',
        email: '',
        username: '',
        password: '',
        role_id: null
    };

    const [users, setUsers] = useState<any[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [user, setUser] = useState<any>(emptyUser);
    const [userDialog, setUserDialog] = useState(false);
    const [deleteUserDialog, setDeleteUserDialog] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [userData, roleData] = await Promise.all([
            UserService.getAll(),
            RoleService.getAll()
        ]);
        setUsers(userData);
        setRoles(roleData);
    };

    const openNew = () => {
        setUser(emptyUser);
        setUserDialog(true);
    };

    const saveUser = async () => {
    try {
        // 1. Creamos una copia para no afectar el formulario visualmente
        const userPayload = { ...user };

        if (user.user_id) {
            // Si existe ID, es una actualización
            await UserService.update(user.user_id, userPayload);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario Actualizado', life: 3000 });
        } else {
            // 2. CRÍTICO: Si es un usuario nuevo, eliminamos el user_id del objeto
            // Esto evita enviar "user_id: null", que causa el Error 500
            delete userPayload.user_id; 

            await UserService.create(userPayload);
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario Creado', life: 3000 });
        }

        setUserDialog(false);
        setUser(emptyUser); // Limpiar el estado
        loadData();         // Recargar la tabla
    } catch (error) {
        console.error("Error al guardar:", error);
        toast.current?.show({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Error en el servidor (500). Revisa que el usuario o correo no estén duplicados.', 
            life: 5000 
        });
    }
};

    // Template para mostrar Nombre Completo en una sola columna
    const fullNameBodyTemplate = (rowData: any) => {
        return `${rowData.first_name} ${rowData.first_surname}`;
    };

    // Template para mostrar el nombre del Rol en lugar del ID
    const roleBodyTemplate = (rowData: any) => {
        const role = roles.find((r) => r.role_id === rowData.role_id);
        return role ? role.role_name : rowData.role_id;
    };

    const actionBodyTemplate = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => { setUser({ ...rowData }); setUserDialog(true); }} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setUser(rowData); setDeleteUserDialog(true); }} />
        </div>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={() => <Button label="Nuevo Usuario" icon="pi pi-plus" severity="success" onClick={openNew} />} />

                    <DataTable value={users} paginator rows={10} responsiveLayout="scroll">
                        <Column field="username" header="Usuario" sortable />
                        <Column header="Nombre Completo" body={fullNameBodyTemplate} />
                        <Column field="email" header="Email" />
                        <Column header="Rol" body={roleBodyTemplate} />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>

                    <Dialog visible={userDialog} style={{ width: '600px' }} header="Detalles de Usuario" modal className="p-fluid" onHide={() => setUserDialog(false)}
                        footer={<><Button label="Cancelar" icon="pi pi-times" text onClick={() => setUserDialog(false)} /><Button label="Guardar" icon="pi pi-check" text onClick={saveUser} /></>}>
                        
                        <div className="formgrid grid">
                            <div className="field col">
                                <label>Primer Nombre</label>
                                <InputText value={user.first_name} onChange={(e) => setUser({...user, first_name: e.target.value})} maxLength={15} />
                            </div>
                            <div className="field col">
                                <label>Segundo Nombre</label>
                                <InputText value={user.second_name} onChange={(e) => setUser({...user, second_name: e.target.value})} maxLength={15} />
                            </div>
                        </div>

                        <div className="formgrid grid">
                            <div className="field col">
                                <label>Primer Apellido</label>
                                <InputText value={user.first_surname} onChange={(e) => setUser({...user, first_surname: e.target.value})} maxLength={15} />
                            </div>
                            <div className="field col">
                                <label>Segundo Apellido</label>
                                <InputText value={user.second_surname} onChange={(e) => setUser({...user, second_surname: e.target.value})} maxLength={15} />
                            </div>
                        </div>

                        <div className="field">
                            <label>Correo Electrónico</label>
                            <InputText value={user.email} onChange={(e) => setUser({...user, email: e.target.value})} />
                        </div>

                        <div className="formgrid grid">
                            <div className="field col">
                                <label>Nombre de Usuario</label>
                                <InputText value={user.username} onChange={(e) => setUser({...user, username: e.target.value})} />
                            </div>
                            <div className="field col">
                                <label>Rol</label>
                                <Dropdown value={user.role_id} options={roles} onChange={(e) => setUser({...user, role_id: e.value})} 
                                    optionLabel="role_name" optionValue="role_id" placeholder="Seleccione un Rol" />
                            </div>
                        </div>

                        <div className="field">
                            <label>Contraseña</label>
                            <Password value={user.password} onChange={(e: any) => setUser({...user, password: e.target.value})} toggleMask feedback={false} />
                        </div>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default UserPage;