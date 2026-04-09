'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toolbar } from 'primereact/toolbar';
import { Toast } from 'primereact/toast';
import { AuditService } from '../../../../src/service/audit.service';

const AuditPage = () => {
    const emptyAudit = {
        audit_id: null,
        description: "",
        last_login: null,
        last_ip: "",
        user_id: ""
    };

    const [audits, setAudits] = useState<any[]>([]);
    const [audit, setAudit] = useState<any>(emptyAudit);
    const [auditDialog, setAuditDialog] = useState(false);
    const [deleteDialog, setDeleteDialog] = useState(false);
    const toast = useRef<Toast>(null);

    useEffect(() => {
        loadAudits();
    }, []);

    const loadAudits = async () => {
        const data = await AuditService.getAll();
        setAudits(data);
    };

    const openNew = () => {
        setAudit(emptyAudit);
        setAuditDialog(true);
    };

    const editAudit = (rowData: any) => {
        setAudit({ ...rowData });
        setAuditDialog(true);
    };

    const saveAudit = async () => {
        if (!audit.description || !audit.user_id) {
            toast.current?.show({ severity: "warn", summary: "Atención", detail: "Descripción y Usuario son obligatorios", life: 3000 });
            return;
        }

        if (audit.audit_id) {
            await AuditService.update(audit.audit_id, audit);
        } else {
            await AuditService.create(audit);
        }

        toast.current?.show({ severity: "success", summary: "Éxito", detail: audit.audit_id ? "Registro actualizado" : "Registro creado", life: 3000 });
        setAuditDialog(false);
        loadAudits();
    };

    const deleteAudit = async () => {
        await AuditService.delete(audit.audit_id);
        toast.current?.show({ severity: "success", summary: "Eliminado", detail: "Registro eliminado", life: 3000 });
        setDeleteDialog(false);
        loadAudits();
    };


    const dateBodyTemplate = (rowData: any) => {
        return rowData.last_activity ? new Date(rowData.last_activity).toLocaleString() : '-';
    };

    const userBodyTemplate = (rowData: any) => {
        return rowData.User ? rowData.User.username : `ID: ${rowData.user_id}`;
    };

    const actionBodyTemplate = (rowData: any) => (
        <>
            <Button icon="pi pi-pencil" rounded severity="success" className="mr-2" onClick={() => editAudit(rowData)} />
            <Button icon="pi pi-trash" rounded severity="danger" onClick={() => { setAudit(rowData); setDeleteDialog(true); }} />
        </>
    );

    return (
        <div className="grid">
            <div className="col-12">
                <div className="card">
                    <Toast ref={toast} />
                    <Toolbar className="mb-4" left={() => <Button label="Nueva Auditoría" icon="pi pi-plus" severity="success" onClick={openNew} />} />

                    <DataTable value={audits} paginator rows={10} responsiveLayout="scroll" emptyMessage="Sin registros de auditoría">
                        <Column field="audit_id" header="ID" sortable />
                        <Column header="Usuario" body={userBodyTemplate} sortable />
                        <Column field="description" header="Descripción" />
                        <Column field="last_ip" header="IP" />
                        <Column header="Fecha Actividad" body={dateBodyTemplate} sortable />
                        <Column body={actionBodyTemplate} header="Acciones" />
                    </DataTable>

                    {/* DIÁLOGO CREAR/EDITAR */}
                    <Dialog visible={auditDialog} style={{ width: '450px' }} header="Detalle de Auditoría" modal onHide={() => setAuditDialog(false)}
                        footer={<><Button label="Cancelar" text onClick={() => setAuditDialog(false)} /><Button label="Guardar" text onClick={saveAudit} /></>}>
                        
                        <div className="field">
                            <label htmlFor="user_id" className="block">ID Usuario</label>
                            <InputText id="user_id" value={audit.user_id} onChange={(e) => setAudit({ ...audit, user_id: e.target.value })} className="w-full" />
                        </div>

                        <div className="field mt-3">
                            <label htmlFor="description" className="block">Descripción</label>
                            <InputTextarea id="description" value={audit.description} onChange={(e) => setAudit({ ...audit, description: e.target.value })} rows={3} className="w-full" />
                        </div>

                        <div className="field mt-3">
                            <label htmlFor="last_ip" className="block">Dirección IP</label>
                            <InputText id="last_ip" value={audit.last_ip} onChange={(e) => setAudit({ ...audit, last_ip: e.target.value })} className="w-full" />
                        </div>
                    </Dialog>

                    {/* DIÁLOGO ELIMINAR */}
                    <Dialog visible={deleteDialog} style={{ width: '400px' }} header="Confirmar" modal onHide={() => setDeleteDialog(false)}
                        footer={<><Button label="No" text onClick={() => setDeleteDialog(false)} /><Button label="Sí" text onClick={deleteAudit} /></>}>
                        <p>¿Desea eliminar este registro de auditoría permanentemente?</p>
                    </Dialog>
                </div>
            </div>
        </div>
    );
};

export default AuditPage;