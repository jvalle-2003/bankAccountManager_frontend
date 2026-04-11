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
import { Tag } from 'primereact/tag'; // NUEVO: Importación del componente Tag para los colores
import { UserService } from '../../../../src/service/user.service';
import { RoleService } from '../../../../src/service/role.service';
import { InputSwitch } from 'primereact/inputswitch';

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
        role_id: null,
        active: true // NUEVO: Es buena práctica inicializarlo en true
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
            const userPayload = { ...user };

            if (user.user_id) {
                await UserService.update(user.user_id, userPayload);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario Actualizado', life: 3000 });
            } else {
                delete userPayload.user_id; 
                await UserService.create(userPayload);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Usuario Creado', life: 3000 });
            }

            setUserDialog(false);
            setUser(emptyUser); 
            loadData();         
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

    // NUEVO: Función para ejecutar la "eliminación lógica" (inactivación)
    const confirmDelete = async () => {
        try {
            if (user.user_id) {
                await UserService.delete(user.user_id);
                toast.current?.show({ severity: 'warn', summary: 'Usuario Inactivado', detail: `El usuario ${user.username} ha sido desactivado.`, life: 3000 });
                setDeleteUserDialog(false);
                setUser(emptyUser);
                loadData(); // Recarga la tabla para que el estado pase a rojo automáticamente
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el usuario', life: 3000 });
        }
    };

    const fullNameBodyTemplate = (rowData: any) => {
        return `${rowData.first_name} ${rowData.first_surname}`;
    };

    const roleBodyTemplate = (rowData: any) => {
        const role = roles.find((r) => r.role_id === rowData.role_id);
        return role ? role.role_name : rowData.role_id;
    };

    // ACTUALIZADO: Template para dibujar la etiqueta (Tag) de ACTIVO/INACTIVO
    const statusBodyTemplate = (rowData: any) => {
        // Ahora evaluamos que no sea false Y que no sea 0. 
        // Si no existe (undefined) por ser un registro viejo, lo toma como Activo.
        const isActive = rowData.active !== false && rowData.active !== 0; 

        return (
            <Tag 
                severity={isActive ? 'success' : 'danger'} 
                value={isActive ? 'ACTIVO' : 'INACTIVO'} 
                rounded 
            />
        );
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
                        {/* NUEVO: Columna de Estado agregada justo antes de las acciones */}
                        <Column header="Estado" body={statusBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>

                    {/* Diálogo de Creación/Edición */}
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
                       
                        {user.user_id && (
                            <div className="field flex align-items-center mt-4">
                                <InputSwitch 
                                    checked={user.active !== false && user.active !== 0} 
                                    onChange={(e) => setUser({...user, active: e.value})} 
                                />
                                <label className="ml-2 mb-0 font-bold">
                                    {user.active !== false && user.active !== 0 ? 'Usuario Activo' : 'Usuario Inactivo'}
                                </label>
                            </div>
                        )}
                        
                    </Dialog>

                    {/* NUEVO: Diálogo de Confirmación para Desactivar. Sin esto, el botón de la basura no hace nada */}
                    <Dialog visible={deleteUserDialog} style={{ width: '450px' }} header="Confirmar Acción" modal onHide={() => setDeleteUserDialog(false)}
                        footer={<><Button label="No" icon="pi pi-times" text onClick={() => setDeleteUserDialog(false)} /><Button label="Sí, Desactivar" icon="pi pi-check" severity="danger" onClick={confirmDelete} /></>}>
                        <div className="flex align-items-center justify-content-center">
                            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                            {user && <span>¿Estás seguro de que deseas desactivar al usuario <b>{user.username}</b>?</span>}
                        </div>
                    </Dialog>

                </div>
            </div>
        </div>
    );
};

export default UserPage;