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

const BanksPage = () => {
    let emptyBank = { 
        bank_id: null, 
        bank_name: '', 
        swift_code: '', 
        active: 1 
    };

    const [banks, setBanks] = useState<any[]>([]);
    const [bank, setBank] = useState<any>(emptyBank);
    const [bankDialog, setBankDialog] = useState(false);
    const [deleteBankDialog, setDeleteBankDialog] = useState(false);
    const toast = useRef<Toast>(null);

    // Carga inicial siguiendo tu ejemplo de BankAccounts
    useEffect(() => { 
        loadBanks(); 
    }, []);

    const loadBanks = async () => {
        try {
            const data = await BankAccountService.getBanks();
            setBanks(data);
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al cargar los bancos' });
        }
    };

    const saveBank = async () => {
        try {
            if (!bank.bank_name || !bank.bank_name.trim() || !bank.swift_code || !bank.swift_code.trim()) {
                toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Complete el nombre y el código SWIFT' });
                return;
            }

            if (bank.bank_id) {
                await BankAccountService.updateBank(bank.bank_id, bank);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Banco Actualizado' });
            } else {
                await BankAccountService.createBank(bank);
                toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Banco Creado' });
            }
            
            setBankDialog(false);
            setBank(emptyBank);
            loadBanks(); // Recarga la tabla para reflejar cambios
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar el registro' });
        }
    };

    const confirmDelete = async () => {
        try {
            // Asegúrate de que el backend ejecute un DELETE físico aquí
            await BankAccountService.deleteBank(bank.bank_id);
            
            setDeleteBankDialog(false);
            setBank(emptyBank);
            loadBanks(); // IMPORTANTE: Recarga la tabla después de borrar
            
            toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Registro eliminado permanentemente' });
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Error al eliminar (Verifique dependencias)' });
        }
    };

    const actionBody = (rowData: any) => (
        <div className="flex gap-2">
            <Button icon="pi pi-pencil" rounded severity="success" onClick={() => { setBank(rowData); setBankDialog(true); }} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setBank(rowData); setDeleteBankDialog(true); }} />
        </div>
    );

    return (
        <div className="card">
            <Toast ref={toast} />
            
            <Toolbar className="mb-4" left={() => (
                <Button label="Nuevo Banco" icon="pi pi-plus" severity="success" onClick={() => { setBank(emptyBank); setBankDialog(true); }} />
            )} />

            <DataTable value={banks} paginator rows={10} responsiveLayout="scroll" emptyMessage="No hay bancos registrados.">
                <Column field="bank_id" header="ID" sortable style={{ width: '10%' }} />
                <Column field="bank_name" header="Nombre del Banco" sortable style={{ width: '40%' }} />
                <Column field="swift_code" header="Código SWIFT" sortable style={{ width: '25%' }} />
                <Column body={actionBody} header="Acciones" style={{ width: '25%' }} />
            </DataTable>

            {/* Diálogo de Gestión */}
            <Dialog visible={bankDialog} style={{ width: '450px' }} header="Gestión de Banco" modal className="p-fluid" onHide={() => setBankDialog(false)}
                footer={<><Button label="Cancelar" icon="pi pi-times" text onClick={() => setBankDialog(false)} /><Button label="Guardar" icon="pi pi-check" onClick={saveBank} /></>}>
                
                <div className="field">
                    <label htmlFor="bank_name" className="font-bold">Nombre del Banco</label>
                    <InputText id="bank_name" value={bank.bank_name} onChange={(e) => setBank({...bank, bank_name: e.target.value})} placeholder="Ej: Banco Industrial" required autoFocus />
                </div>

                <div className="field mt-3">
                    <label htmlFor="swift_code" className="font-bold">Código SWIFT</label>
                    <InputText id="swift_code" value={bank.swift_code || ''} onChange={(e) => setBank({...bank, swift_code: e.target.value})} placeholder="Ej: INDIGTGC" required />
                </div>
            </Dialog>

            {/* Diálogo de Eliminación */}
            <Dialog visible={deleteBankDialog} style={{ width: '450px' }} header="Confirmar Eliminación" modal onHide={() => setDeleteBankDialog(false)}
                footer={<><Button label="No" icon="pi pi-times" text onClick={() => setDeleteBankDialog(false)} /><Button label="Sí, Eliminar" icon="pi pi-check" severity="danger" onClick={confirmDelete} /></>}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: 'red' }} />
                    <span>¿Estás seguro de eliminar permanentemente el banco <b>{bank.bank_name}</b>?</span>
                </div>
            </Dialog>
        </div>
    );
};

export default BanksPage;