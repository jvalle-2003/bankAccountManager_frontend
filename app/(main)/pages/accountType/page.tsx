'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import React, { useEffect, useRef, useState } from 'react';
import { BankAccountService } from '../../../../demo/service/BankAccountService';

const AccountTypePage = () => {
    let emptyType = {
        account_type_id: null,
        type_name: '',
        active: true
    };

    const [types, setTypes] = useState<any[]>([]);
    const [type, setType] = useState<any>(emptyType);
    const [typeDialog, setTypeDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false); // Estado para el diálogo de borrar
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        try {
            const data = await BankAccountService.getAccountTypes();
            setTypes(data);
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos' });
        }
    };

    const saveType = async () => {
        try {
            if (type.type_name.trim()) {
                if (type.account_type_id) {
                    await BankAccountService.updateAccountType(type.account_type_id, type);
                    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo Actualizado' });
                } else {
                    await BankAccountService.createAccountType(type);
                    toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo Creado' });
                }
                setTypeDialog(false);
                loadTypes();
            }
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al guardar' });
        }
    };

    // Función para ejecutar el borrado físico
    const confirmDelete = async () => {
        try {
            await BankAccountService.deleteAccountType(type.account_type_id);
            setDeleteDialog(false);
            loadTypes(); // Recarga la tabla
            toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo de cuenta eliminado permanentemente' });
        } catch (error) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Error', 
                detail: 'No se puede eliminar: El tipo está siendo usado en cuentas bancarias' 
            });
        }
    };

    const actionBody = (rowData: any) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-pencil" rounded severity="success" onClick={() => { setType(rowData); setTypeDialog(true); }} />
                <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setType(rowData); setDeleteDialog(true); }} />
            </div>
        );
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            
            <Toolbar className="mb-4" left={() => (
                <Button label="Nuevo Tipo de Cuenta" icon="pi pi-plus" severity="success" onClick={() => { setType(emptyType); setTypeDialog(true); }} />
            )} />

            <DataTable value={types} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay registros.">
                <Column field="account_type_id" header="ID" sortable style={{ width: '15%' }} />
                <Column field="type_name" header="Descripción del Tipo" sortable />
                <Column body={actionBody} header="Acciones" style={{ width: '15%' }} />
            </DataTable>

            {/* Diálogo de Edición/Creación */}
            <Dialog visible={typeDialog} style={{ width: '450px' }} header="Gestión de Tipo de Cuenta" modal className="p-fluid" onHide={() => setTypeDialog(false)}
                footer={<><Button label="Cancelar" icon="pi pi-times" text onClick={() => setTypeDialog(false)} /><Button label="Guardar" icon="pi pi-check" onClick={saveType} /></>}>
                <div className="field">
                    <label htmlFor="type_name" className="font-bold">Nombre del Tipo</label>
                    <InputText id="type_name" value={type.type_name} onChange={(e) => setType({...type, type_name: e.target.value})} required autoFocus />
                </div>
            </Dialog>

            {/* Diálogo de Confirmación de Borrado */}
            <Dialog visible={deleteDialog} style={{ width: '450px' }} header="Confirmar" modal onHide={() => setDeleteDialog(false)}
                footer={<><Button label="No" icon="pi pi-times" text onClick={() => setDeleteDialog(false)} /><Button label="Sí, Eliminar" icon="pi pi-check" severity="danger" onClick={confirmDelete} /></>}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: 'red' }} />
                    <span>¿Estás seguro de que deseas eliminar permanentemente <b>{type.type_name}</b>?</span>
                </div>
            </Dialog>
        </div>
    );
};

export default AccountTypePage;