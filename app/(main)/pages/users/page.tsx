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
import { Tag } from 'primereact/tag';
import { UserService } from '../../../../src/service/user.service';
import { RoleService } from '../../../../src/service/role.service';
import { InputSwitch } from 'primereact/inputswitch';

// Importación de la utilidad genérica de descargas
import { downloadFileFromBackend } from '../../../../src/utils/download.utils';

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
        role_id: null,
        active: true 
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

    const confirmDelete = async () => {
        try {
            if (user.user_id) {
                await UserService.delete(user.user_id);
                toast.current?.show({ severity: 'warn', summary: 'Usuario Inactivado', detail: `El usuario ${user.username} ha sido desactivado.`, life: 3000 });
                setDeleteUserDialog(false);
                setUser(emptyUser);
                loadData(); 
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar el usuario', life: 3000 });
        }
    };

    // =====================================================================
    // Función limpia que utiliza el helper genérico (AHORA INCLUYE 'csv')
    // =====================================================================
    const handleDownload = async (format: 'excel' | 'pdf' | 'csv') => {
        try {
            // URL específica para este módulo (usuarios)
            const url = `http://localhost:3001/api/users/report/export?format=${format}`;
            
            await downloadFileFromBackend(url, 'Reporte_Usuarios', format);
            
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: `Reporte en ${format.toUpperCase()} descargado`, life: 3000 });
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo descargar el reporte', life: 3000 });
        }
    };

    // =====================================================================
    // Templates para el Toolbar
    // =====================================================================
    const leftToolbarTemplate = () => {
        return (
            <div className="flex flex-wrap gap-2">
                <Button label="Nuevo Usuario" icon="pi pi-plus" severity="success" onClick={openNew} />
            </div>
        );
    };

    const rightToolbarTemplate = () => {
        return (
            <div className="flex align-items-center justify-content-end gap-2">
                <Button type="button" icon="pi pi-file-excel" severity="success" rounded onClick={() => handleDownload('excel')} tooltip="Descargar Excel" tooltipOptions={{ position: 'bottom' }} />
                <Button type="button" icon="pi pi-file" severity="info" rounded onClick={() => handleDownload('csv')} tooltip="Descargar CSV" tooltipOptions={{ position: 'bottom' }} />
                <Button type="button" icon="pi pi-file-pdf" severity="warning" rounded onClick={() => handleDownload('pdf')} tooltip="Descargar PDF" tooltipOptions={{ position: 'bottom' }} />
            </div>
        );
    };

    const fullNameBodyTemplate = (rowData: any) => {
        return `${rowData.first_name} ${rowData.first_surname}`;
    };

    const roleBodyTemplate = (rowData: any) => {
        const role = roles.find((r) => r.role_id === rowData.role_id);
        return role ? role.role_name : rowData.role_id;
    };

    const statusBodyTemplate = (rowData: any) => {
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
                    
                    {/* Toolbar actualizado */}
                    <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

                    <DataTable value={users} paginator rows={10} responsiveLayout="scroll">
                        <Column field="username" header="Usuario" sortable />
                        <Column header="Nombre Completo" body={fullNameBodyTemplate} />
                        <Column field="email" header="Email" />
                        <Column header="Rol" body={roleBodyTemplate} />
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

                    {/* Diálogo de Confirmación para Desactivar */}
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