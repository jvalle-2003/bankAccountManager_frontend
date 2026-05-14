'use client';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Toolbar } from 'primereact/toolbar';
import { classNames } from 'primereact/utils';
import React, { useEffect, useRef, useState } from 'react';
import { BankAccountService } from '@/src/service/BankAccountService';

const AccountTypePage = () => {
    let emptyType = {
        account_type_id: null,
        type_name: '',
        active: true
    };

    const [types, setTypes] = useState<any[]>([]);
    const [type, setType] = useState<any>(emptyType);
    const [typeDialog, setTypeDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const [submitted, setSubmitted] = useState(false); // Rastreo para validación visual
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

    // ==========================================
    // VALIDACIÓN: BLOQUEAR NÚMEROS AL ESCRIBIR
    // ==========================================
    const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const regex = /^[^0-9]*$/; // Cualquier cosa que NO sea un número

        if (regex.test(val)) {
            setType({ ...type, type_name: val });
        } else {
            toast.current?.show({
                severity: 'warn',
                summary: 'Formato inválido',
                detail: 'El tipo de cuenta no puede contener números',
                life: 2000
            });
        }
    };

    const saveType = async () => {
        setSubmitted(true);

        // 1. VALIDACIÓN: CAMPO VACÍO
        if (!type.type_name || !type.type_name.trim()) {
            toast.current?.show({ 
                severity: 'error', 
                summary: 'Atención', 
                detail: 'Debe ingresar una descripción para el tipo de cuenta' 
            });
            return;
        }

        // 2. VALIDACIÓN: DUPLICADOS (Frontend)
        const isDuplicate = types.some(t => 
            t.type_name.toLowerCase().trim() === type.type_name.toLowerCase().trim() && 
            t.account_type_id !== type.account_type_id
        );

        if (isDuplicate) {
            toast.current?.show({
                severity: 'warn',
                summary: 'Registro Existente',
                detail: `El tipo de cuenta "${type.type_name}" ya existe.`,
                life: 4000
            });
            return;
        }

        try {
            if (type.account_type_id) {
                await BankAccountService.updateAccountType(type.account_type_id, type);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo Actualizado' });
            } else {
                await BankAccountService.createAccountType(type);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Tipo Creado' });
            }
            setTypeDialog(false);
            setSubmitted(false);
            loadTypes();
        } catch (error) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al conectar con la base de datos local' });
        }
    };

    const confirmDelete = async () => {
        try {
            await BankAccountService.deleteAccountType(type.account_type_id);
            setDeleteDialog(false);
            loadTypes();
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
                <Button icon="pi pi-pencil" rounded severity="success" onClick={() => { setSubmitted(false); setType(rowData); setTypeDialog(true); }} />
                <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setType(rowData); setDeleteDialog(true); }} />
            </div>
        );
    };

    return (
        <div className="card">
            <Toast ref={toast} />
            
            <Toolbar className="mb-4" left={() => (
                <Button label="Nuevo Tipo de Cuenta" icon="pi pi-plus" severity="success" onClick={() => { setSubmitted(false); setType(emptyType); setTypeDialog(true); }} />
            )} />

            <DataTable value={types} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay registros en el sistema local.">
                <Column field="account_type_id" header="ID" sortable style={{ width: '15%' }} />
                <Column field="type_name" header="Descripción del Tipo" sortable />
                <Column body={actionBody} header="Acciones" style={{ width: '15%' }} />
            </DataTable>

            {/* Diálogo de Edición/Creación */}
            <Dialog 
                visible={typeDialog} 
                style={{ width: '450px' }} 
                header="Gestión de Tipo de Cuenta" 
                modal 
                className="p-fluid" 
                onHide={() => setTypeDialog(false)}
                footer={
                    <>
                        <Button label="Cancelar" icon="pi pi-times" text onClick={() => setTypeDialog(false)} />
                        <Button label="Guardar" icon="pi pi-check" onClick={saveType} />
                    </>
                }
            >
                <div className="field">
                    <label htmlFor="type_name" className="font-bold">Nombre del Tipo</label>
                    <InputText 
                        id="type_name" 
                        value={type.type_name} 
                        onChange={onNameChange} 
                        placeholder="Ej: Ahorros, Monetaria, Plazo Fijo"
                        required 
                        autoFocus 
                        className={classNames({ 'p-invalid': submitted && (!type.type_name || !type.type_name.trim()) })}
                    />
                    {submitted && (!type.type_name || !type.type_name.trim()) && <small className="p-error">El nombre del tipo es obligatorio.</small>}
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